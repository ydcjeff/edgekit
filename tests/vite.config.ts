import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import inspect from 'vite-plugin-inspect';
import { ezedge, ezedge_deno, ezedge_netlify } from '../src/vite/mod.ts';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		inspect(),
		ezedge(),
		ezedge_deno(),
		ezedge_netlify(),
		// ezedge_vercel(),
	],
	build: {
		minify: false,
	},
});
