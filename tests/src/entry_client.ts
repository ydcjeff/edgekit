import { start_client } from 'edgekit';
import { create_uni_app } from './main';

start_client((el, hydrable) => {
	const [app, router] = create_uni_app(hydrable);
	router.isReady().then(() => app.mount(el));
});
