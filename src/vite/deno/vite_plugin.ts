import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * A EZedge Vite plugin for Deno Deploy.
 */
export function ezedge_deno(): Plugin {
	const name = 'ezedge:deno';

	if (!process.env.DENO) {
		return { name };
	}

	return {
		name,
		apply: (_, { isSsrBuild }) => !!isSsrBuild,

		config() {
			return {
				build: {
					rollupOptions: {
						input: {
							main: path.join(dirname, 'deploy.ts'),
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
