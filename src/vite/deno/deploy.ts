import { is_assets_path } from '../../runtime/mod.ts';
import { handler } from '@ydcjeff/ezedge/entry_server';
import * as path from 'https://deno.land/std@0.221.0/path/mod.ts';
import { serveFile } from 'https://deno.land/std@0.221.0/http/file_server.ts';

const dirname = path.dirname(path.fromFileUrl(import.meta.url));

Deno.serve((req) => {
	const url = new URL(req.url);

	if (is_assets_path(url)) {
		return serveFile(req, path.join(dirname, '../client', url.pathname));
	}

	return handler(req);
});
