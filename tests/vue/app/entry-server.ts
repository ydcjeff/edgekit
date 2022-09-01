import { renderHeadToString } from '@vueuse/head';
import { respond_html, type RequestHandler } from 'edgekit';
import { manifest } from 'edgekit:manifest';
import { renderToString } from 'vue/server-renderer';
import { create_uni_app } from './app.js';

export const respond: RequestHandler = async (event) => {
	// create vue on server side
	const [app, router, head_client] = create_uni_app();

	// navigate to a new url and wait for it
	await router.push(event.url.pathname);
	await router.isReady();

	// render the body string
	const body = await renderToString(app);

	// render the head string, this needs to be after `renderToString`
	const head = renderHeadToString(head_client);

	return respond_html({ manifest, body, head, hydrate: true });
};
