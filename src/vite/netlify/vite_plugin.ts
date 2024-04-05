import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const NETLIFY_EDGE_FN_DIR = '.netlify/edge-functions';
const NETLIFY_EDGE_FN_MANIFEST = {
	version: 1,
	functions: [
		{
			function: 'main',
			path: '/*',
		},
	],
};

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * A EZedge Vite plugin for Netlify Edge Functions.
 */
export function ezedge_netlify(): Plugin {
	const name = 'ezedge:netlify';

	if (!process.env.NETLIFY) {
		return { name };
	}

	return {
		name,
		apply: (_, { isSsrBuild }) => !!isSsrBuild,

		config() {
			return {
				build: {
					outDir: NETLIFY_EDGE_FN_DIR,
					rollupOptions: {
						input: { main: path.join(dirname, 'edge.ts') },
						output: {
							inlineDynamicImports: true,
						},
					},
				},
				ssr: {
					noExternal: true,
					target: 'webworker',
				},
			};
		},

		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'manifest.json',
				source: JSON.stringify(NETLIFY_EDGE_FN_MANIFEST),
			});
		},
	};
}
