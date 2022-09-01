import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { get_request, install_polyfills, set_response } from '../node/mod.js';
import { get_entry, mkdirp, stringify_manifest } from './utils.js';

/** @typedef {import('./index').PluginOptions} PluginOptions */

const DOT_EDGEKIT = 'node_modules/.edgekit/';
const EDGEKIT_MANIFEST = DOT_EDGEKIT + 'manifest.mjs';

/**
 * @param {PluginOptions} [options]
 * @returns {import('vite').Plugin}
 */
export function edgekit(options) {
	/** @type {Required<PluginOptions>} */
	const opts = {
		entry_client: 'app/entry-client',
		entry_server: 'app/entry-server',
		...options,
	};

	/** @type {string} */
	let template;

	/** @type {import('vite').ResolvedConfig} */
	let vite_config;

	/** @type {string} */
	let entry_client_filename;

	/** @type {string} */
	let entry_server_filename;

	return {
		name: 'vite-plugin-edgekit',

		config({ build, root = process.cwd() }, { command }) {
			opts.entry_client = get_entry(path.resolve(root, opts.entry_client));
			opts.entry_server = get_entry(path.resolve(root, opts.entry_server));

			if (command === 'build') {
				const ssr = !!build?.ssr;
				const assetsDir = build?.assetsDir || '_edk';

				const output = {
					entryFileNames: ssr
						? `[name].js`
						: path.posix.join(assetsDir, `[name]-[hash].js`),
					chunkFileNames: ssr
						? `chunks/[name].js`
						: path.posix.join(assetsDir, `c/[name]-[hash].js`), // c for chunks
					// this is required to set to match client/server assets build
					assetFileNames: path.posix.join(assetsDir, `a/[name]-[hash].[ext]`), // a for assets
				};

				if (ssr) {
					entry_server_filename = path
						.basename(opts.entry_server)
						.replace(path.extname(opts.entry_server), '');

					return {
						publicDir: false,
						build: {
							assetsDir,
							outDir: '.node',
							rollupOptions: {
								input: opts.entry_server,
								output,
							},
						},
						define: {
							'typeof window': '"undefined"',
							'typeof document': '"undefined"',
						},
						resolve: {
							alias: {
								'edgekit:entry-server': opts.entry_server,
								'edgekit:manifest': path.resolve(root, EDGEKIT_MANIFEST),
							},
						},
					};
				} else {
					entry_client_filename = path
						.basename(opts.entry_client)
						.replace(path.extname(opts.entry_client), '');

					return {
						base: './',
						build: {
							assetsDir,
							rollupOptions: {
								input: {
									__edgekit_html__: 'index.html',
									[entry_client_filename]: opts.entry_client,
								},
								output,
								onwarn(warning, warn) {
									if (!warning.message.includes('__edgekit_html__')) {
										warn(warning);
									}
								},
							},
						},
					};
				}
			} else {
				return {
					appType: 'custom',
					build: {
						rollupOptions: {
							input: opts.entry_client,
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
			install_polyfills();
			return () => {
				server.middlewares.use(async (req, res) => {
					try {
						if (!req.url || !req.method) throw new Error('incomplete request');

						const { config } = server;
						const protocol = config.server.https ? 'https' : 'http';
						const origin = protocol + '://' + req.headers.host;

						template = await server.transformIndexHtml(
							req.url,
							template,
							req.originalUrl,
						);

						const request = get_request(origin, req);

						/** @type {import('../runtime/index').RequestHandler} */
						const respond = (await server.ssrLoadModule(opts.entry_server))
							.respond;

						const resp = await respond({
							request,
							url: new URL(request.url),
							seg: {},
							platform: {},
						});

						if (resp) {
							set_response(res, resp);
						}
					} catch (/** @type {any} */ e) {
						server.ssrFixStacktrace(e);
						res.statusCode = 500;
						res.end(e.stack);
					}
				});
			};
		},

		async configurePreviewServer(server) {
			install_polyfills();

			const { server_main } = await import(
				pathToFileURL(path.resolve(vite_config.root, EDGEKIT_MANIFEST)).href
			);
			/** @type {import('../runtime/index').RequestHandler} */
			const respond = (await import(pathToFileURL(server_main).href)).respond;

			return () => {
				server.middlewares.use(async (req, res) => {
					try {
						if (!req.url || !req.method) throw new Error('incomplete request');
						const protocol = vite_config.preview.https ? 'https' : 'http';
						const origin = protocol + '://' + req.headers.host;

						const request = get_request(origin, req);
						const resp = await respond({
							request,
							url: new URL(request.url),
							seg: {},
							platform: {},
						});

						if (resp) {
							set_response(res, resp);
						}
					} catch (/** @type {any} */ e) {
						res.statusCode = e.status || 400;
						res.end(e.reason || 'invalid requst body');
					}
				});
			};
		},

		resolveId(id) {
			if (vite_config.command === 'serve' && id === 'edgekit:manifest') {
				return '\0' + id;
			}
		},

		load(id) {
			if (vite_config.command === 'serve' && id === '\0' + 'edgekit:manifest') {
				return stringify_manifest(
					template,
					vite_config.build.assetsDir,
					opts.entry_client,
					vite_config.build.outDir,
				);
			}
		},

		generateBundle: {
			order: 'post',
			handler(_, bundle) {
				mkdirp(path.resolve(vite_config.root, DOT_EDGEKIT));

				for (const k in bundle) {
					const val = bundle[k];

					if (vite_config.build.ssr) {
						if (val.name === entry_server_filename) {
							fs.appendFileSync(
								path.resolve(vite_config.root, EDGEKIT_MANIFEST),
								`\nexport const server_main = ${JSON.stringify(
									path.resolve(
										vite_config.root,
										vite_config.build.outDir,
										val.fileName,
									),
								)};`,
								'utf-8',
							);
						}
					} else {
						if (val.name === entry_client_filename) {
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
						path.resolve(vite_config.root, EDGEKIT_MANIFEST),
						stringify_manifest(
							template,
							vite_config.build.assetsDir,
							entry_client_filename,
							vite_config.build.outDir,
						),
						'utf-8',
					);
				}
			},
		},
	};
}

export { edgekit_deno } from './deno/vite_plugin.js';
export { edgekit_netlify } from './netlify/vite_plugin.js';
export { edgekit_vercel } from './vercel/vite_plugin.js';
