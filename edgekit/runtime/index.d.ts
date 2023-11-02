/// <reference types="./ambient" />
/// <reference types="vite/client" />

export * from './mod.js';

type MaybePromise<T> = T | Promise<T>;

export type RequestHandler = (req: Request) => MaybePromise<Response>;

/**
 * The handler interface of `start_client` function.
 */
export type StartClientFn = (
	el: HTMLElement,
	hydratable: boolean,
	data: unknown | null,
) => void;

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
