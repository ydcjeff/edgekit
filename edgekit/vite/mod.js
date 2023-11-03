import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { get_request, set_response } from '../node/mod.js';
import { get_entry, mkdirp, stringify_metadata } from './utils.js';

export { edgekit };
export { edgekit_deno } from './deno/vite_plugin.js';
export { edgekit_netlify } from './netlify/vite_plugin.js';
export { edgekit_vercel } from './vercel/vite_plugin.js';

/**
 * @returns {import('vite').Plugin}
 */
function edgekit() {
	/** @type {string} */
	let entry_client_file;

	/** @type {string} */
	let entry_server_file;

	/** @type {string} */
	let template = '';

	/** @type {import('vite').ResolvedConfig} */
	let vite_config;

	/** @type {string} */
	let dot_edgekit;

	/** @type {string} */
	let dot_edgekit_metadata;

	return {
		name: 'vite-plugin-edgekit',

		config({ build, root = process.cwd(), publicDir }, { command }) {
			entry_client_file = get_entry(path.resolve(root, 'src/entry_client'));
			entry_server_file = get_entry(path.resolve(root, 'src/entry_server'));

			dot_edgekit = path.join(root, `node_modules/.edgekit`);
			dot_edgekit_metadata = path.join(dot_edgekit, 'metadata.mjs');

			if (command === 'build') {
				const ssr = !!build?.ssr;

				// respect user configured outDir
				const outDir = build?.outDir || ssr ? 'dist/node' : 'dist';
				// respect user configured assetsDir
				const assetsDir = build?.assetsDir || '_edk';

				return {
					publicDir: ssr ? false : publicDir,
					build: {
						manifest: ssr ? false : '.vite/manifest.json',
						assetsDir,
						outDir,
						rollupOptions: {
							input: ssr
								? entry_server_file
								: {
									__edgekit_html__: 'index.html',
									entry_client: entry_client_file,
								},
							output: {
								entryFileNames: ssr
									? `[name].js`
									: path.posix.join(assetsDir, `[name]_[hash].js`),
								chunkFileNames: ssr
									? `chunks/[name].js`
									: path.posix.join(assetsDir, `c/[name]_[hash].js`), // c for chunks
								// this is required to set to match client/server assets build
								assetFileNames: path.posix.join(
									assetsDir,
									`a/[name]_[hash].[ext]`, // a for assets
								),
							},
						},
					},
					resolve: {
						alias: ssr
							? {
								// resolve from fs when in SSR build
								'edgekit:entry_server': entry_server_file,
								'edgekit:metadata': dot_edgekit_metadata,
							}
							: undefined,
					},
				};
			}
			// DEV
			else {
				return {
					appType: 'custom',
					build: {
						rollupOptions: {
							input: entry_client_file,
						},
					},
				};
			}
		},

		configResolved(config) {
			vite_config = config;

			if (config.command === 'serve') {
				template = fs.readFileSync(
					path.resolve(config.root, 'index.html'),
					'utf-8',
				);
			}
		},

		configureServer(server) {
			return () => {
				server.middlewares.use(async (req, res) => {
					try {
						if (!req.url) {
							throw new Error('incomplete request');
						}

						const { config } = server;
						const protocol = config.server.https ? 'https' : 'http';
						const origin = protocol + '://' + req.headers.host;

						template = await server.transformIndexHtml(
							req.url,
							template,
							req.originalUrl,
						);

						const request = get_request(origin, req);

						const { handler } =
							/** @type {import('edgekit:entry_server')} */ (await server
								.ssrLoadModule(entry_server_file));

						const resp = await handler(request);

						if (resp) {
							set_response(res, resp);
						}
					}
					catch (/** @type {any} */ e) {
						server.ssrFixStacktrace(e);
						res.statusCode = 500;
						res.end(e.stack);
					}
				});
			};
		},

		async configurePreviewServer(server) {
			const { entry_server_fp } = await import(
				pathToFileURL(dot_edgekit_metadata).href
			);

			const { handler } =
				/** @type {import('edgekit:entry_server')} */ (await import(
					pathToFileURL(entry_server_fp).href
				));

			return () => {
				server.middlewares.use(async (req, res) => {
					try {
						const protocol = vite_config.preview.https ? 'https' : 'http';
						const origin = protocol + '://' + req.headers.host;

						const request = get_request(origin, req);
						const resp = await handler(request);

						if (resp) {
							set_response(res, resp);
						}
					}
					catch (/** @type {any} */ e) {
						res.statusCode = e.status || 400;
						res.end(e.reason || 'invalid requst body');
					}
				});
			};
		},

		resolveId(id) {
			// Exclude EdgeKit virtual modules in SSR build
			if (!vite_config.build.ssr && id === 'edgekit:metadata') {
				return '\0' + id;
			}
		},

		load(id) {
			// Exclude EdgeKit virtual modules in SSR build
			if (!vite_config.build.ssr && id === '\0' + 'edgekit:metadata') {
				return stringify_metadata({
					entries: { js: [entry_client_file], css: [] },
					template,
				});
			}
		},

		generateBundle: {
			order: 'post',
			handler(_, bundle) {
				if (!vite_config.build.ssr) {
					for (const k in bundle) {
						const chunk = bundle[k];
						if (chunk.type === 'asset' && chunk.fileName === 'index.html') {
							template = /** @type {string} */ (chunk.source);
							delete bundle[k]; // remove index.html file
						}
					}
				}
			},
		},

		writeBundle(_, bundle) {
			mkdirp(dot_edgekit);

			if (vite_config.build.ssr) {
				for (const k in bundle) {
					const chunk = bundle[k];

					if (chunk.name === 'entry_server') {
						fs.appendFileSync(
							dot_edgekit_metadata,
							`export const entry_server_fp = ${
								JSON.stringify(
									path.resolve(
										vite_config.root,
										vite_config.build.outDir,
										chunk.fileName,
									),
								)
							};\n`,
							'utf-8',
						);
					}
				}
			}
			else {
				const manifest = /** @type {ViteManifestChunk[]} */ (Object.values(
					JSON.parse(fs.readFileSync(
						path.join(
							vite_config.build.outDir,
							/** @type {string} */ (vite_config.build.manifest),
						),
						'utf-8',
					)),
				));

				const entries = {
					js: /** @type {string[]} */ ([]),
					css: /** @type {string[]} */ ([]),
				};

				for (const entry of manifest) {
					if (entry.isEntry) {
						entries.js.push(entry.file);
						if (entry.css?.length) {
							entries.css.push(...entry.css);
						}
					}
				}

				fs.writeFileSync(
					dot_edgekit_metadata,
					stringify_metadata({
						assets_dir: vite_config.build.assetsDir,
						entries,
						template,
					}),
					'utf-8',
				);
			}
		},
	};
}

/**
 * @typedef ViteManifestChunk
 * @property {string} [src]
 * @property {string} file
 * @property {string[]} [css]
 * @property {string[]} [assets]
 * @property {boolean} [isEntry]
 * @property {boolean} [isDynamicEntry]
 * @property {string[]} [imports]
 * @property {string[]} [dynamicImports]
 */
