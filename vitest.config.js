import { defaultExclude, defineConfig } from 'vitest/config';

const EDGEKIT_METADATA_MODULE_ID = 'edgekit:metadata';

export default defineConfig({
	plugins: [
		{
			name: '',
			resolveId(id) {
				if (id === EDGEKIT_METADATA_MODULE_ID) {
					return '\0' + EDGEKIT_METADATA_MODULE_ID;
				}
			},
			load(id) {
				if (id === '\0' + EDGEKIT_METADATA_MODULE_ID) {
					return `export const build_id = "";
					export const _ = {
						assets_dir: "",
						entries: {
							js: [],
							css: [],
						},
						tmpl: () => "",
					};`;
				}
			},
		},
	],
	test: {
		exclude: [...defaultExclude, './tests'],
	},
});
