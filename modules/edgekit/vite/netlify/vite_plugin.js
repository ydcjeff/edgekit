import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { is_server_build } from '../utils.js';

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

const _dirname = path.dirname(fileURLToPath(import.meta.url));

/** @returns {import('vite').Plugin} */
export function edgekit_netlify() {
	return {
		name: 'edgekit:netlify',
		apply: is_server_build,

		config() {
			return {
				build: {
					outDir: NETLIFY_EDGE_FN_DIR,
					rollupOptions: {
						input: {
							main: path.resolve(_dirname, 'edge.js'),
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
