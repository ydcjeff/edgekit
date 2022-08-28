import App from './App.vue';
import { routes } from './routes.js';
import { createHead } from '@vueuse/head';
import { createApp, createSSRApp } from 'vue';
import {
	createMemoryHistory,
	createRouter,
	createWebHistory,
} from 'vue-router';

export function create_uni_app(hydrate = false) {
	const router = createRouter({
		history: import.meta.env.SSR
			? createMemoryHistory(import.meta.env.BASE_URL)
			: createWebHistory(import.meta.env.BASE_URL),
		routes,
	});

	const head = createHead();

	const app = import.meta.env.SSR
		? createSSRApp(App)
		: hydrate
		? createSSRApp(App)
		: createApp(App);

	app.use(router).use(head);

	return [app, router, head] as const;
}
