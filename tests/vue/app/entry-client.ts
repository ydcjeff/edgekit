import { create_uni_app } from './app.js';
import { start_client } from 'edgekit';

start_client(import.meta.url, async (el, hydrate) => {
	const [app, router] = create_uni_app(hydrate);
	await router.isReady();
	app.mount(el);
});
