import './assets/main.css';

import { createApp, createSSRApp } from 'vue';
import {
	createMemoryHistory,
	createRouter,
	createWebHistory,
} from 'vue-router';
import App from './App.vue';
import HomeView from './views/HomeView.vue';

export function create_uni_app(hydrate: boolean) {
	const app = hydrate ? createSSRApp(App) : createApp(App);

	const router = createRouter({
		history: import.meta.env.SSR
			? createMemoryHistory(import.meta.env.BASE_URL)
			: createWebHistory(import.meta.env.BASE_URL),
		routes: [
			{
				path: '/',
				name: 'home',
				component: HomeView,
			},
			{
				path: '/nested/about',
				name: 'about',
				component: () => import('./views/AboutView.vue'),
			},
		],
	});

	app.use(router);

	return [app, router] as const;
}
