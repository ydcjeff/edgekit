import type { RouteRecordRaw } from 'vue-router';

const home = () => import('./routes/home.vue');

export const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: home,
	},
];
