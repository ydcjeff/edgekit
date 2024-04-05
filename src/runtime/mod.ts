/// <reference types="vite/client" />
/// <reference lib="dom" />

import * as devalue from 'devalue';

let build_id: string;
let assets_dir: string;
let base: string;
let entry_clients: string[];
let preloads: Record<string, string[]>;
let template: string;

/**
 * Private function.
 * @private
 */
export function __set_all(
	_assets_dir: string,
	_base: string,
	_entry_clients: string[],
	_preloads: Record<string, string[]>,
	_template: string,
) {
	assets_dir = _assets_dir;
	base = _base;
	entry_clients = _entry_clients;
	build_id = _entry_clients[0]!.slice(-11, -3);
	preloads = _preloads;
	template = _template;
}

/**
 * Start the client side script to run either hydration or app mounting. This
 * function should be called in the entry file that will be run on the client
 * side.
 */
export function start_client(
	import_meta_url: string,
	fn: (el: HTMLElement, hydratable: boolean, data: unknown | null) => void,
) {
	const id = import_meta_url.slice(-11, -3);
	const el = document.getElementById(id);
	if (!el) throw new Error(`element w/ id ${id} not found`);

	const text = el.nextElementSibling?.textContent;
	const data: [boolean, unknown] = text ? devalue.parse(text) : [];
	fn(el.parentElement!, ...data);
}

/** Render the complete HTML to be sent. */
export function render_html({
	url,
	body = '',
	head = '',
	csr = false,
	data = null,
}: {
	url: string | URL;
	body?: string;
	head?: string | { headTags: string; htmlAttrs: string; bodyAttrs: string };
	csr?: boolean;
	data?: unknown;
}): string {
	const { pathname } = new URL(url);
	const seen = new Set<string>();
	let link_tags = '';
	if (pathname !== '/') {
		for (const key in preloads) {
			if (key.includes(pathname.slice(base.length + 1))) {
				link_tags += gen_link_tags(preloads[key]!, seen);
			}
		}
	}
	link_tags += gen_link_tags(entry_clients, seen);

	const script = csr
		? `
	<script type="module" async src="${entry_clients[0]}" id=${build_id}></script>
	<script type="application/json">${devalue.stringify([csr, data])}</script>\n\t`
		: '';

	body = `<div>${body}${script}</div>`;

	if (typeof head === 'string') {
		return templated(body, link_tags + head);
	}
	return templated(
		body,
		link_tags + head.headTags,
		head.htmlAttrs,
		head.bodyAttrs,
	);
}

/**
 * Serialise the Content Security Policy Directives to be directly used as
 * header value.
 */
export function serialise_csp(csp: CSPDirectives) {
	csp = {
		'default-src': [`'self'`],
		...csp,
	};
	return Object.entries(csp)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k} ${v.join(' ')}`)
		.join('; ');
}

/** Check if the requested url is for assets or not. */
export function is_assets_path(url: URL): boolean {
	return url.pathname.slice(base.length).startsWith(assets_dir);
}

function gen_link_tags(files: string[], seen: Set<string>) {
	let tags = '';
	for (const file of files) {
		if (!seen.has(file)) {
			let rel = '';
			if (file.endsWith('.css')) {
				rel = 'stylesheet';
			} else if (file.endsWith('.js')) {
				rel = 'modulepreload';
			} else {
				// TODO other MIME types
			}
			tags += `<link href="${file}" rel="${rel}">\n\t`;
			seen.add(file);
		}
	}
	return tags;
}

function templated(body = '', head = '', html_attrs = '', body_attrs = '') {
	return template
		.replace('<html', '<html ' + html_attrs)
		.replace('<body', '<body ' + body_attrs)
		.replace('</head>', head + '</head>')
		.replace('</body>', body + '</body>');
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
 */
export interface CSPDirectives {
	// fetch directives
	/**
	 * Defines the valid sources for web workers and nested browsing contexts
	 * loaded using elements such as `<frame>` and `<iframe>`.
	 */
	'child-src'?: string[];

	/**
	 * Restricts the URLs which can be loaded using script interfaces
	 */
	'connect-src'?: string[];

	/**
	 * Serves as a fallback for the other fetch directives.
	 */
	'default-src'?: string[];

	/**
	 * Specifies valid sources for fonts loaded using `@font-face`.
	 */
	'font-src'?: string[];

	/**
	 * Specifies valid sources for nested browsing contexts loading using
	 * elements such as `<frame>` and `<iframe>`.
	 */
	'frame-src'?: string[];

	/**
	 * Specifies valid sources of images and favicons.
	 */
	'img-src'?: string[];

	/**
	 * Specifies valid sources of application manifest files.
	 */
	'manifest-src'?: string[];

	/**
	 * Specifies valid sources for loading media using the `<audio>`, `<video>`
	 * and `<track>` elements.
	 */
	'media-src'?: string[];

	/**
	 * Specifies valid sources to be prefetched or prerendered.
	 *
	 * @experimental
	 */
	'prefetch-src'?: string[];

	/**
	 * Specifies valid sources for JavaScript.
	 */
	'script-src'?: string[];

	/**
	 * Specifies valid sources for JavaScript `<script>` elements.
	 *
	 * @experimental
	 */
	'script-src-elem'?: string[];

	/**
	 * Specifies valid sources for JavaScript inline event handlers.
	 *
	 * @experimental
	 */
	'script-src-attr'?: string[];

	/**
	 * Specifies valid sources for stylesheets.
	 */
	'style-src'?: string[];

	/**
	 * Specifies valid sources for stylesheets `<style>` elements and `<link>`
	 * elements with `rel="stylesheet"`.
	 *
	 * @experimental
	 */
	'style-src-elem'?: string[];

	/**
	 * Specifies valid sources for inline styles applied to individual DOM
	 * elements.
	 *
	 * @experimental
	 */
	'style-src-attr'?: string[];

	/**
	 * Specifies valid sources for `Worker`, `SharedWorker`, or `ServiceWorker`
	 * scripts.
	 *
	 * @experimental
	 */
	'worker-src'?: string[];

	// document directives
	/**
	 * Restricts the URLs which can be used in a document's `<base>` element.
	 */
	'base-uri'?: string[];

	/**
	 * Enables a sandbox for the requested resource similar to the `<iframe>`
	 * sandbox attribute.
	 */
	sandbox?: string[];

	// navigation directives
	/**
	 * Restricts the URLs which can be used as the target of a form submissions from a given context.
	 */
	'form-action'?: string[];

	/**
	 * Specifies valid parents that may embed a page using `<frame>`, `<iframe>`,
	 * `<object>`, `<embed>`, or `<applet>`.
	 */
	'frame-ancestors'?: string[];

	/**
	 * Restricts the URLs to which a document can initiate navigation by any means,
	 * including `<form>` (if `form-action` is not specified), `<a>`,
	 * `window.location`, `window.open`, etc.
	 *
	 * @experimental
	 */
	'navigate-to'?: string[];

	// reporting directives
	/**
	 * Instructs the user agent to report attempts to violate the Content Security
	 * Policy. These violation reports consist of JSON documents sent via an HTTP
	 * `POST` request to the specified URI.
	 *
	 * @deprecated
	 */
	'report-uri'?: string[];

	/**
	 * Fires a `SecurityPolicyViolationEvent`.
	 *
	 * @experimental
	 */
	'report-to'?: string[];

	// other directives
	/**
	 * Requires the use of SRI for scripts or styles on the page.
	 *
	 * @experimental
	 */
	'require-sri-for'?: string[];

	/**
	 * Enforces Trusted Types at the DOM XSS injection sinks.
	 *
	 * @experimental
	 */
	'require-trusted-types-for'?: string[];

	/**
	 * Used to specify an allow-list of Trusted Types policies.
	 * Trusted Types allows applications to lock down DOM XSS injection sinks to
	 * only accept non-spoofable, typed values in place of strings.
	 *
	 * @experimental
	 */
	'trusted-types'?: string[];

	/**
	 * Instructs user agents to treat all of a site's insecure URLs
	 * (those served over HTTP) as though they have been replaced with secure URLs
	 * (those served over HTTPS). This directive is intended for websites with
	 * large numbers of insecure legacy URLs that need to be rewritten.
	 */
	'upgrade-insecure-requests'?: string[];
}
