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
	let entry_client_filename;

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
					entry_client: entry_client_file,
					template,
				});
			}
		},

		generateBundle: {
			order: 'post',
			handler(_, bundle) {
				mkdirp(dot_edgekit);

				for (const k in bundle) {
					const val = bundle[k];

					if (vite_config.build.ssr) {
						if (val.name === 'entry_server') {
							fs.appendFileSync(
								dot_edgekit_metadata,
								`\nexport const entry_server_fp = ${
									JSON.stringify(
										path.resolve(
											vite_config.root,
											vite_config.build.outDir,
											val.fileName,
										),
									)
								}`,
								'utf-8',
							);
						}
					}
					else {
						if (val.name === 'entry_client') {
							entry_client_filename = val.fileName;
						}

						if (val.type === 'asset' && val.fileName === 'index.html') {
							template = /** @type {string} */ (val.source);
							delete bundle[k];
						}
					}
				}

				if (!vite_config.build.ssr) {
					fs.writeFileSync(
						dot_edgekit_metadata,
						stringify_metadata({
							assets_dir: vite_config.build.assetsDir,
							entry_client: entry_client_filename,
							template,
						}),
						'utf-8',
					);
				}
			},
		},
	};
}
