import vue from '@vitejs/plugin-vue';
import inspect from 'vite-plugin-inspect';
import { defineConfig } from 'vite';
import { edgekit, edgekit_netlify } from 'edgekit/vite';

export default defineConfig({
	plugins: [vue(), edgekit(), inspect(), edgekit_netlify()],
	build: {
		minify: false,
	},
});
