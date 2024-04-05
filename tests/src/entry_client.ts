import { start_client } from '../../src/runtime/mod.ts';
import { create_uni_app } from './main.ts';

start_client(import.meta.url, (el, hydrable) => {
	const [app, router] = create_uni_app(hydrable);
	router.isReady().then(() => app.mount(el));
});
