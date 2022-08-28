/**
 * Start the server side script to run. The return value should be exported
 * default.
 *
 * ```ts
 * // entry-server.ts
 * import { start_server, respond_data, respond_html } from 'edgekit';
 *
 * export default start_server(routes, (ev, mod) => {
 *   if (mod) return respond_data(ev, mod)
 *
 *   const { html: body, head } = App.render()
 *
 *   return respond_html({ body, head })
 * })
 * ```
 *
 * @param {import('./index').EndpointRoute[] | null} routes api routes
 * @param {import('./index').StartServerFn} fn
 * @returns {import('./index').RequestHandler}
 */
export function create_handler(routes, fn) {
	const proutes = routes && flat_routes(routes);

	return async ({ request, url, platform = {}, seg = {} }) => {
		/** @type {import('./index').EndpointModule | undefined} */
		let mod;

		if (proutes) {
			for (const proute of proutes) {
				const { pathname } = url;
				const res = proute.pattern.exec({ pathname });
				if (res) {
					mod = await proute.mod();
					seg = Object.fromEntries(
						Object.entries(res.pathname.groups)
							.filter(([, v]) => !!v)
							.map(([k, v]) => {
								if (v?.includes('/')) return [k, v.split('/')];
								return [k, v];
							}),
					);
				}
			}
		}

		return await fn({ request, url, platform, seg }, mod);
	};
}

/**
 * @param {import('./index').EndpointRoute[]} routes
 * @param {string} path
 * @param {Array<{ pattern: import('urlpattern-polyfill/dist/types').URLPattern, mod: () => Promise<import('./index').EndpointModule> }>} proutes
 */
function flat_routes(routes, path = '', proutes = []) {
	routes.forEach(({ pathname, mod, children }) => {
		pathname = path + pathname;
		// @ts-ignore it is polyfilled
		const pattern = new URLPattern({ pathname });
		proutes.push({ pattern, mod });
		if (children) flat_routes(children, pathname, proutes);
	});
	return proutes;
}
