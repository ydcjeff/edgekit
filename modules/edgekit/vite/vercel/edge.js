import { respond } from 'edgekit:entry-server';

export default async function (request) {
	const url = new URL(request.url);
	return await respond({ request, url });
}
