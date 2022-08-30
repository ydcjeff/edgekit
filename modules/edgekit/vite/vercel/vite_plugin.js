import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

const VC_CONFIG = {
	runtime: 'edge',
	entrypoint: 'main.js',
};

/** @returns {import('vite').Plugin} */
export function edgekit_vercel() {
	/** @type {import('vite').ResolvedConfig} */
	let vite_config;

	return {
		name: 'edgekit:vercel',
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
				this.emitFile({
					type: 'asset',
					fileName: 'config.json',
					source: JSON.stringify(
						{
							version: 3,
							routes: [
								{
									src: '/' + vite_config.build.assetsDir + '/*',
									headers: {
										'cache-control': 'public, immutable, max-age=31536000',
									},
								},
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
					source: JSON.stringify(VC_CONFIG, null, '\t'),
				});
			}
		},
	};
}
