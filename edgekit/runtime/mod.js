import * as devalue from 'devalue';
import { _, build_id } from 'edgekit:metadata';

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Start the client side script to run either hydration or app mounting. This
 * function should be called in the entry file that will be run on the client
 * side.
 *
 * ```ts
 * // entry_client.ts
 * import { start_client } from 'edgekit';
 *
 * start_client((target, hydrate) => {
 *   new App({ target, hydrate })
 * })
 * ```
 *
 * @param {import('./index').StartClientFn} fn
 */
export function start_client(fn) {
	const el = document.getElementById(build_id);
	if (!el) throw new Error(`target element with id ${build_id} not found`);
	const tc = el.lastElementChild?.textContent;

	/** @type {[boolean, unknown]} */
	const injected = tc ? devalue.parse(tc) : [];

	fn(el, ...injected);
}

/**
 * Render the complete HTML to be sent.
 *
 * @param {Object} options
 * @param {string} options.url Current request url
 * @param {string} [options.body] HTML body
 * @param {string | HTMLResult} [options.head] HTML head
 * @param {boolean} [options.csr]
 * @param {unknown} [options.data] Any fetched data
 */
export function render_html({
	url,
	body = '',
	head = '',
	csr = false,
	data = null,
}) {
	const { entries, tmpl } = _;
	const prefix = import.meta.env.PROD
		? (new URL(url).pathname
					.slice(BASE_URL.length)
					.split('/')
					.slice(2)
					.map(() => '..')
					.join('/') + '' || '.') + '/'
		: '';

	const js_scripts = entries.js.map((js) =>
		`<script type="module" async src="${prefix}${js}"></script>`
	).join('\n');

	const css_links =
		entries.css.map((css) => `<link rel="stylesheet" href="${prefix}${css}">`)
			.join('\n\t') + '\n';

	const script = csr
		? js_scripts
			+ `<script type="application/json">`
			+ devalue.stringify([csr, data])
			+ `</script>`
		: '';

	// TODO: generate preload links
	body = `<div id="${build_id}">${body}${script}</div>`;

	if (typeof head === 'string') {
		return tmpl(body, css_links + head);
	}
	return tmpl(
		body,
		css_links + head.headTags,
		head.htmlAttrs,
		head.bodyAttrs,
	);
}

/**
 * Serialise the Content Security Policy Directives to be directly used as
 * header value.
 *
 * @param {import('./index').CSPDirectives} [csp]
 */
export function serialise_csp(csp) {
	csp = {
		'default-src': [`'self'`],
		...csp,
	};
	return Object.entries(csp)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k} ${v.join(' ')}`)
		.join('; ');
}

/**
 * Check if the requested url is for assets or not.
 *
 * @param {URL} url
 */
export function is_assets_path(url) {
	return url.pathname.slice(BASE_URL.length).startsWith(`/${_.assets_dir}`);
}

/**
 * @typedef HTMLResult
 * @property {string} htmlAttrs
 * @property {string} bodyAttrs
 * @property {string} headTags
 */
