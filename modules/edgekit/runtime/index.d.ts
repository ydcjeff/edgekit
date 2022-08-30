/// <reference types="./ambient" />
/// <reference types="vite/client" />

export * from './mod.js';

export type Awaitable<T> = Promise<T> | T;

export interface Manifest {
	/**
	 * The namespace of the client built files. They are nested under that
	 * namespace to avoid collisions in URL.
	 *
	 * @default `_edk`
	 */
	namespace: string;
	/**
	 * Client build output directory. Defaults to Vite's `build.outDir`.
	 *
	 * @default `dist`
	 */
	client_outdir: string;
	/**
	 * entry client
	 *
	 * @internal
	 */
	_ec: string;
	/**
	 * HTML template function
	 *
	 * @internal
	 */
	_tmpl: (
		body: string,
		head: string,
		html_attrs?: string,
		body_attrs?: string,
	) => string;
}

/**
 * The handler interface of `start_client` function.
 */
export type StartClientFn = (
	el: HTMLElement,
	hydrate: boolean,
	data: unknown | null,
	state: unknown | null,
) => void;

/**
 * The handler interface of `start_server` function.
 */
export type StartServerFn = (
	event: RequestEvent,
	mod?: EndpointModule,
) => Awaitable<Response>;

/**
 * The endpoint module with the named exports of HTTP methods as functions.
 */
export interface EndpointModule {
	[method: string]: RequestHandler;
}

/**
 * The interface of functions in endpoint module.
 */
export type RequestHandler = (event: RequestEvent) => Awaitable<Response>;

export interface EndpointRoute {
	pathname: string;
	mod: () => Promise<EndpointModule>;
	children?: EndpointRoute[];
}

/**
 * Platform specific context object. Provide platform specific context to enable
 * type completions. For example, in Deno:
 *
 * ```ts
 * import type { ConnInfo } from 'https://deno.land/std/http/mod.ts'
 * declare module 'edgekit' {
 *   interface Platform {
 *     conn_info: ConnInfo
 *   }
 * }
 * ```
 */
export interface Platform {}

/**
 * The properties relating with current request event.
 */
export interface RequestEvent {
	/**
	 * The current request.
	 */
	request: Request;
	/**
	 * The URL of the request.
	 */
	url: URL;
	/**
	 * The matched route segments.
	 *
	 * @default `{}`
	 */
	seg?: Record<string, string | string[]>;
	/**
	 * Platform specific context.
	 *
	 * @default `{}`
	 */
	platform?: Readonly<Platform>;
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
