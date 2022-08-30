import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { is_server_build } from '../utils.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

/** @returns {import('vite').Plugin} */
export function edgekit_deno() {
	return {
		name: 'edgekit:deno',
		apply: is_server_build,

		config() {
			return {
				build: {
					outDir: '.deno',
					rollupOptions: {
						input: {
							main: path.resolve(_dirname, 'deploy.js'),
						},
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
	};
}
