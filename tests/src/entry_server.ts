import { render_html } from 'edgekit';
import { create_uni_app } from './main';

import { renderToString } from 'vue/server-renderer';

export async function handler(req: Request) {
	const [app, router] = create_uni_app(true);

	// visit requested route
	await router.push(new URL(req.url).pathname);

	// wait til navigation completes
	await router.isReady();

	// render HTML
	const body = await renderToString(app);
	const html = render_html({
		url: req.url,
		body,
		csr: true,
	});

	return new Response(html, {
		status: 200,
		headers: {
			'content-type': 'text/html',
		},
	});
}
