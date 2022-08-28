import { create_uni_app } from './app.js';
import { start_client } from 'edgekit';

start_client(import.meta.url, async (el, hydrate, data) => {
	const [app, router, _, moku] = create_uni_app(hydrate);
	moku.data = data;
	await router.isReady();
	app.mount(el);
});
