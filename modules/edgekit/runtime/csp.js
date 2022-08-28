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
