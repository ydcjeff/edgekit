import { respond } from 'edgekit:entry-server';

// TODO: KV asset
export default {
	async fetch(request, env, context) {
		const url = new URL(request.url);

		return await respond({ request, url, platform: { env, context } });
	},
};
