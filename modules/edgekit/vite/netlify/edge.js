import { respond } from 'edgekit:entry-server';
import { manifest } from 'edgekit:manifest';

export default async function (request, context) {
	const url = new URL(request.url);

	if (url.pathname.startsWith('/' + manifest.namespace)) {
		return context.next();
	}

	return await respond({ request, url, platform: { context } });
}
