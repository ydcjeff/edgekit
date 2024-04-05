/**
 * @module
 *
 * This module contains EZedge related Vite plugins.
 *
 * ```ts
 * // vite.config.ts
 * import { ezedge, ezedge_deno, ezedge_netlify } from '@ydcjeff/ezedge/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     ezedge(),
 *     ezedge_deno(), // for Deno Deploy
 *     ezedge_netlify(), // for Netlify Edge Functions
 *   ],
 * });
 * ```
 */

import { createMiddleware } from '@hattip/adapter-node';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createViteRuntime,
	type ManifestChunk,
	type Plugin,
	type ResolvedConfig,
} from 'vite';

export { ezedge_deno } from './deno/vite_plugin.ts';
export { ezedge_netlify } from './netlify/vite_plugin.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const ezedge_runtime_path = path.join(dirname, '../runtime/mod');
const generated_file = path.join(dirname, 'ezedge.gen.js');

/** A EZedge Vite plugin. */
export function ezedge(): Plugin {
	let entry_client_path = '';
	let entry_server_path = '';
	let template_path = '';
	let template = '';
	let vite_config: ResolvedConfig;

	return {
		name: 'ezedge',
		config({ build, root = process.cwd() }, { isSsrBuild, isPreview }) {
			entry_server_path = get_entry(path.join(root, 'src/entry_server'));
			if (!entry_server_path) return;
			entry_client_path = get_entry(path.join(root, 'src/entry_client'), !0);
			template_path = path.join(root, 'index.html');

			return {
				appType: 'custom',
				build: {
					copyPublicDir: !isSsrBuild,
					manifest: isSsrBuild ? false : '.vite/manifest.json',
					ssrManifest: isSsrBuild ? false : '.vite/ssr-manifest.json',
					assetsDir: build?.assetsDir || '_ez',
					outDir: isSsrBuild || isPreview ? 'dist/server' : 'dist/client',
					rollupOptions: {
						input: isSsrBuild
							? entry_server_path
							: {
									__ezedge_html__: template_path,
									entry_client: entry_client_path,
								},
					},
				},
				resolve: {
					alias: {
						'@ydcjeff/ezedge/entry_server': entry_server_path,
					},
				},
			};
		},

		configResolved(config) {
			vite_config = config;

			if (config.command === 'serve' && entry_server_path) {
				template = fs.readFileSync(template_path, 'utf-8');
			}
		},

		async configureServer(server) {
			if (!entry_server_path) return;
			const runtime = await createViteRuntime(server);
			const middleware = createMiddleware(async ({ request }) => {
				template = await server.transformIndexHtml(request.url, template);
				const { handler } = await runtime.executeEntrypoint(entry_server_path!);
				return handler(request);
			});

			return () => server.middlewares.use(middleware);
		},

		async configurePreviewServer(server) {
			if (!entry_server_path) return;
			const { handler } = await import(
				path.join(vite_config.root, vite_config.build.outDir, 'entry_server.js')
			);
			return () => {
				server.middlewares.use(
					createMiddleware(({ request }) => {
						return handler(request);
					}),
				);
			};
		},

		load(id) {
			if (
				entry_server_path &&
				vite_config.command === 'serve' &&
				id.includes(generated_file)
			) {
				return stringify_metadata({
					assets_dir: vite_config.build.assetsDir,
					base: vite_config.base,
					entry_clients: [path.join(vite_config.base, entry_client_path)],
					preloads: {},
					template,
				});
			}
		},

		transform(code, id) {
			if (entry_server_path && id.includes(entry_server_path)) {
				return `import '${generated_file}';\n${code}`;
			}
		},

		generateBundle: {
			order: 'post',
			handler(_, bundle) {
				if (entry_server_path && !vite_config.build.ssr) {
					for (const k in bundle) {
						const chunk = bundle[k];
						if (
							chunk &&
							chunk.type === 'asset' &&
							chunk.fileName === 'index.html'
						) {
							template = chunk.source as string;
							delete bundle[k]; // remove index.html file
						}
					}
				}
			},
		},

		writeBundle() {
			if (entry_server_path && !vite_config.build.ssr) {
				const manifest = Object.values<ManifestChunk>(
					JSON.parse(
						fs.readFileSync(
							path.join(
								vite_config.root,
								vite_config.build.outDir,
								vite_config.build.manifest as string,
							),
							'utf-8',
						),
					),
				);
				const _ssr_manifest: Record<string, string[]> = JSON.parse(
					fs.readFileSync(
						path.join(
							vite_config.root,
							vite_config.build.outDir,
							vite_config.build.ssrManifest as string,
						),
						'utf-8',
					),
				);
				const ssr_manifest: Record<string, string[]> = {};
				for (const [id, files] of Object.entries(_ssr_manifest)) {
					if (files.length) {
						ssr_manifest[id.toLowerCase()] = files;
					}
				}

				const entries = [];
				for (const chunk of manifest) {
					if (chunk.isEntry) {
						entries.push(path.join(vite_config.base, chunk.file));
						if (chunk.css?.length) {
							for (const css of chunk.css) {
								entries.push(path.join(vite_config.base, css));
							}
						}
						if (chunk.assets?.length) {
							for (const asset of chunk.assets) {
								entries.push(path.join(vite_config.base, asset));
							}
						}
					}
				}

				fsp.writeFile(
					generated_file,
					stringify_metadata({
						assets_dir: vite_config.build.assetsDir,
						base: vite_config.base,
						entry_clients: entries,
						preloads: ssr_manifest,
						template,
					}),
				);
			}
		},
	};
}

function get_entry(entry: string, abort: boolean = false) {
	const exts = ['.ts', '.js'];
	for (const ext of exts) {
		if (entry.endsWith(ext)) {
			return entry;
		}
	}
	const ext = exts.find((ext) => fs.existsSync(entry + ext));
	if (abort && !ext) {
		throw new Error(`missing ${entry}.js or ${entry}.ts`);
	}
	return ext ? entry + ext : '';
}

const s = JSON.stringify;
function stringify_metadata({
	assets_dir,
	base,
	entry_clients,
	preloads,
	template,
}: {
	assets_dir: string;
	base: string;
	entry_clients: string[];
	preloads: Record<string, string[]>;
	template: string;
}) {
	return `
	import { __set_all } from '${ezedge_runtime_path}';
	__set_all(
		${s(assets_dir)},
		${s(base.endsWith('/') ? base : base + '/')},
		${s(entry_clients)},
		${s(preloads)},
		${s(template)},
	);`;
}
