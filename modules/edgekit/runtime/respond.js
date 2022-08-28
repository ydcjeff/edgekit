import * as http_status from './http_status.js';
import * as http_status_text from './http_status_text.js';
import { fnv1a } from './hash.js';
import { valid_id } from './utils.js';

/**
 * @typedef HTMLResult
 * @property {string} htmlAttrs
 * @property {string} bodyAttrs
 * @property {string} headTags
 */

/**
 * Respond the HTML to the client.
 *
 * @param {Object} options
 * @param {import('./index').Manifest} options.manifest
 * @param {string} options.body
 * @param {string | HTMLResult} [options.head]
 * @param {boolean} [options.hydrate]
 * @param {boolean} [options.spa]
 * @param {unknown} [options.data]
 * @param {unknown} [options.state]
 */
export function respond_html({
	manifest,
	body = '',
	head = '',
	hydrate = false,
	spa = false,
	data = null,
	state = null,
}) {
	let html;

	const { _ec, _tmpl } = manifest;

	// prettier-ignore
	const script = hydrate || spa
		? `<script type="module" async src="${_ec}"></script>` +
			`<script type="application/json">` +
			JSON.stringify([hydrate, data, state]) +
			'</script>'
		: '';

	body = `<div id="${valid_id(_ec)}">${body}${script}</div>`;

	if (typeof head === 'string') {
		html = _tmpl(body, head);
	} else if (head) {
		html = _tmpl(body, head.headTags, head.htmlAttrs, head.bodyAttrs);
	}

	return new Response(html, {
		status: 200,
		headers: {
			'content-type': 'text/html',
		},
	});
}

/**
 * Respond the request that requests the data from endpoint.
 *
 * @param {import('./index').RequestEvent} ev
 * @param {import('./index').EndpointModule} mod
 */
export async function respond_data(ev, mod) {
	const method = ev.request.method;
	const handler = mod[method];

	if (!handler) {
		return new Response(`${method} method not allowed`, {
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405
			status: http_status.MethodNotAllowed,
			statusText: http_status_text.MethodNotAllowed,
			headers: {
				allow: Object.keys(mod).join(', '),
			},
		});
	}

	const [body, resp_init] = await handler(ev);

	if (resp_init) {
		if (!(resp_init.headers instanceof Headers)) {
			resp_init.headers = new Headers(resp_init.headers);
		}

		const { headers } = resp_init;

		if (
			!headers.has('etag') &&
			(typeof body === 'string' || body instanceof Uint8Array)
		) {
			const cc = headers.get('cache-control');
			if (!cc || !/(no-store|immutable)/.test(cc)) {
				headers.set('etag', `"${fnv1a(body)}"`);
			}
		}
	}

	return new Response(body, resp_init);
}
