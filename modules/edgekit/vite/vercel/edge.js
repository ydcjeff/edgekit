import { handler } from 'edgekit:entry-server';

export default async function (request) {
	const url = new URL(request.url);
	return await handler({ request, url });
}
