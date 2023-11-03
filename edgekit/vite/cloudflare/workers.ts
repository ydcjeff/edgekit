import { handler } from 'edgekit:entry_server';

// TODO: KV asset
export default {
	async fetch(request: Request) {
		return await handler(request);
	},
};
