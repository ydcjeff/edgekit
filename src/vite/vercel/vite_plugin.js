import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * A Vite plugin that outputs according to [Vercel Build Output API (v3)](https://vercel.com/docs/build-output-api/v3).
 *
 * @returns {import('vite').Plugin}
 */
export function ezedge_vercel() {
	/** @type {import('vite').ResolvedConfig} */
	let vite_config;

	const name = 'ezedge:vercel';

	if (!process.env.VERCEL) {
		return { name };
	}

	return {
		name,
		apply: 'build',

		config({ build }) {
			const ssr = !!build?.ssr;

			return {
				build: {
					outDir: `.vercel/output/${ssr ? '' : 'static'}`,
					emptyOutDir: ssr ? false : true,
					rollupOptions: {
						input: ssr
							? {
									'functions/main.func/main': path.resolve(_dirname, 'edge.js'),
								}
							: undefined,
						output: ssr
							? {
									inlineDynamicImports: true,
								}
							: undefined,
					},
				},
				ssr: {
					noExternal: true,
					target: 'webworker',
				},
			};
		},

		configResolved(config) {
			vite_config = config;
		},

		generateBundle() {
			if (vite_config.build.ssr) {
				// https://vercel.com/docs/build-output-api/v3/configuration
				this.emitFile({
					type: 'asset',
					fileName: 'config.json',
					source: JSON.stringify(
						{
							version: 3,
							routes: [
								{
									src: '/' + vite_config.build.assetsDir + '/.+',
									headers: {
										'cache-control': 'public, immutable, max-age=31536000',
									},
								},
								{ handle: 'filesystem' },
								{
									src: '/.*',
									dest: '/main',
								},
							],
						},
						null,
						'\t',
					),
				});

				this.emitFile({
					type: 'asset',
					fileName: 'functions/main.func/.vc-config.json',
					source: JSON.stringify(
						{
							runtime: 'edge',
							entrypoint: 'main.js',
						},
						null,
						'\t',
					),
				});
			}
		},
	};
}
