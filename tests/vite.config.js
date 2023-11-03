import vue from '@vitejs/plugin-vue';
import {
	edgekit,
	edgekit_deno,
	edgekit_netlify,
	edgekit_vercel,
} from 'edgekit/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		edgekit(),
		edgekit_deno(),
		edgekit_netlify(),
		edgekit_vercel(),
	],
	build: {
		minify: false,
	},
});
