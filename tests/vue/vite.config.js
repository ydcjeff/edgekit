import vue from '@vitejs/plugin-vue';
import inspect from 'vite-plugin-inspect';
import { defineConfig } from 'vite';
import { edgekit } from 'edgekit/vite';

export default defineConfig({
	plugins: [vue(), edgekit(), inspect()],
	build: {
		minify: false,
	},
});
