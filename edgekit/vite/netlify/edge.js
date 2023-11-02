import { is_assets_path } from 'edgekit';
import { handler } from 'edgekit:entry_server';

/**
 * @param {Request} request
 * @param {import('@netlify/edge-functions').Context} context
 */
export default async function(request, context) {
	const url = new URL(request.url);

	if (is_assets_path(url)) {
		return context.next();
	}

	return handler(request);
}
