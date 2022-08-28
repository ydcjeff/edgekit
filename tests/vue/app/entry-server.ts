import { create_uni_app } from './app.js';
import { renderHeadToString } from '@vueuse/head';
import { create_handler, respond_data, respond_html } from 'edgekit';
import { renderToString } from 'vue/server-renderer';
import type { EndpointRoute } from 'edgekit';
import { manifest } from 'edgekit:manifest';

const routes: EndpointRoute[] = [
	{
		pathname: '/data',
		mod: () => import('./routes/data'),
		children: [
			{
				pathname: '/child',
				mod: () => import('./routes/data'),
			},
		],
	},
];

export const handler = create_handler(routes, async (event, mod) => {
	if (mod) return respond_data(event, mod);

	// create vue on server side
	const [app, router, head_client] = create_uni_app();

	// navigate to a new url and wait for it
	await router.push(event.url.pathname);
	await router.isReady();

	// render the body string
	const body = await renderToString(app);

	// render the head string, this needs to be after `renderToString`
	const head = renderHeadToString(head_client);

	// get route config for the url, this also needs to be after `renderToString`
	// const { hydrate, csp } = get_route_config(router);

	return respond_html({ manifest, body, head, hydrate: true });
});
