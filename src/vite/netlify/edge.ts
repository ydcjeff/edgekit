import { is_assets_path } from '../../runtime/mod.ts';
import { handler } from '@ydcjeff/ezedge/entry_server';
import type { Context } from '@netlify/edge-functions';

export default function (req: Request, context: Context) {
	const url = new URL(req.url);

	if (is_assets_path(url)) {
		return context.next();
	}

	return handler(req, context);
}
