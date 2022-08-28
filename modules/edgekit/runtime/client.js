import { valid_id } from './utils.js';

/**
 * Start the client side script to run either hydration or app mounting. This
 * function should be called in the entry file that will be run on the client
 * side since it uses the `import.meta.url` to determine the target element to
 * hydrate or mount.
 *
 * ```ts
 * // entry-client.ts
 * import { start_client } from 'edgekit';
 *
 * start_client(import.meta.url, (target, hydrate) => {
 *   new App({ target, hydrate })
 * })
 * ```
 *
 * @param {string} import_meta_url value should be `import.meta.url`
 * @param {import('./index').StartClientFn} fn
 */
export function start_client(import_meta_url, fn) {
	const id = valid_id(import_meta_url);
	const el = document.getElementById(id);
	if (!el) throw new Error(`target element with id ${id} not found`);
	const tc = el.lastElementChild?.textContent;

	/** @type {[boolean, unknown, unknown]} */
	const injected = tc ? JSON.parse(tc) : [];

	fn(el, ...injected);
}
