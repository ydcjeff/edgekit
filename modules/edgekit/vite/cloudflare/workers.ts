import { handler } from 'edgekit:entry-server';

// TODO: KV asset
export default {
	async fetch(request, env, context) {
		const url = new URL(request.url);

		return await handler({ request, url, platform: { env, context } });
	},
};
