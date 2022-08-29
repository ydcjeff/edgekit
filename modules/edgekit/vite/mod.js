import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { get_request, install_polyfills, set_response } from '../node/mod.js';
import { get_entry, stringify_manifest } from './utils.js';

/** @typedef {import('./index').PluginOptions} PluginOptions */

const _dirname = path.dirname(fileURLToPath(import.meta.url));

export { edgekit_netlify } from './netlify/vite_plugin.js';

/**
 * @param {PluginOptions} [options]
 * @returns {import('vite').Plugin}
 */
export function edgekit(options) {
	/** @type {Required<PluginOptions>} */
	const opts = {
		entry_client: './app/entry-client',
		entry_server: './app/entry-server',
		runtime: !!process.env.CF_PAGES
			? 'cloudflare'
			: !!process.env.DENO
			? 'deno'
			: !!process.env.NETLIFY
			? 'netlify'
			: !!process.env.VERCEL
			? 'vercel'
			: 'node',
		...options,
	};

	/** @type {string} */
	let template;

	/** @type {import('vite').ResolvedConfig} */
	let vite_config;

	/** @type {string} */
	let ec;

	/** @type {Record<string, string>} */
	const client_input = {};

	return {
		name: 'vite-plugin-edgekit',

		config({ build, publicDir, root = process.cwd() }) {
			const ssr = !!build?.ssr;
			const dist = path.posix.join(
				build?.outDir || 'dist',
				ssr ? 'server' : 'client',
			);
			const namespace = build?.assetsDir || '_edk';

			if (!ssr) {
				opts.entry_client = get_entry(path.resolve(root, opts.entry_client));
				ec = path
					.basename(opts.entry_client)
					.replace(path.extname(opts.entry_client), '');
				client_input.__edgekit_html__ = 'index.html';
				client_input[ec] = opts.entry_client;
			} else {
				opts.entry_server = get_entry(path.resolve(root, opts.entry_server));
			}

			return {
				appType: 'custom',
				base: './', // Vite resolves to `/` in ssr and dev

				build: {
					assetsDir: namespace,
					manifest: ssr ? false : 'manifest.json',
					ssrManifest: ssr ? false : 'ssr-manifest.json',
					outDir: dist,
					polyfillModulePreload: false,
					rollupOptions: {
						input: ssr
							? opts.runtime !== 'node'
								? path.join(_dirname, opts.runtime, 'deploy')
								: { main: opts.entry_server }
							: client_input,
						output: {
							entryFileNames: ssr
								? `[name].js`
								: path.posix.join(namespace, `[name]-[hash].js`),
							chunkFileNames: ssr
								? `chunks/[name].js`
								: path.posix.join(namespace, `c/[name]-[hash].js`), // c for chunks
							assetFileNames: path.posix.join(
								namespace,
								`a/[name]-[hash].[ext]`, // a for assets
							),
						},
						onwarn(warning, warn) {
							if (!warning.message.includes('__edgekit_html__')) {
								warn(warning);
							}
						},
					},
				},

				define: ssr
					? { 'typeof window': '"undefined"', 'typeof document': '"undefined"' }
					: undefined,

				publicDir: ssr ? false : publicDir,

				resolve: {
					alias: ssr
						? {
								'edgekit:entry-server': opts.entry_server,
								'edgekit:manifest': path.join(dist, '../.vite/manifest.js'),
						  }
						: undefined,
				},

				ssr: {
					target: opts.runtime === 'node' ? 'node' : 'webworker',
					noExternal: opts.runtime !== 'node' ? true : [],
				},
			};
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

						/** @type {import('edgekit').StartServerFn} */
						const handler = (await server.ssrLoadModule(opts.entry_server))
							.handler;

						const resp = await handler({
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

			const entry_server = path.join(
				vite_config.build.outDir,
				'../server/main.js', // TODO: avoid this hardcode
			);
			const { handler } = await import(pathToFileURL(entry_server).href);

			return () => {
				server.middlewares.use(async (req, res) => {
					try {
						if (!req.url || !req.method) throw new Error('incomplete request');
						const protocol = vite_config.preview.https ? 'https' : 'http';
						const origin = protocol + '://' + req.headers.host;

						const request = get_request(origin, req);
						const resp = await handler({
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
				);
			}
		},

		generateBundle: {
			order: 'post',
			handler(_, bundle) {
				if (!vite_config.build.ssr) {
					for (const k in bundle) {
						const val = bundle[k];

						if (val.type === 'asset') {
							if (vite_config.build.manifest === val.fileName) {
								val.fileName = path.join('../.vite', val.fileName);
							}

							if (val.fileName === 'index.html') {
								template = /** @type {string} */ (val.source);
								delete bundle[k];
							}
						}

						if (val.name === ec) {
							ec = val.fileName;
						}
					}

					bundle['_edgekit_manifest'] = {
						type: 'asset',
						fileName: '../.vite/manifest.js',
						source: stringify_manifest(
							template,
							vite_config.build.assetsDir,
							ec,
						),
					};
				}
			},
		},
	};
}
