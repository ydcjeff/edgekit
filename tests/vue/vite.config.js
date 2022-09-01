import vue from '@vitejs/plugin-vue';
import { edgekit } from 'edgekit/vite';
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';

export default defineConfig({
	plugins: [vue(), edgekit(), inspect()],
	build: {
		minify: false,
	},
});
