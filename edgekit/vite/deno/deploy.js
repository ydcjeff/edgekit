import { is_assets_path } from 'edgekit';
import { handler } from 'edgekit:entry_server';
// @ts-expect-error This is Deno
import * as path from 'https://deno.land/std@0.205.0/path/mod.ts';
// @ts-expect-error This is Deno
import { serveFile } from 'https://deno.land/std@0.205.0/http/file_server.ts';

const dirname = path.dirname(path.fromFileUrl(import.meta.url));

// @ts-expect-error This is Deno
Deno.serve((req) => {
	const url = new URL(req.url);

	if (is_assets_path(url)) {
		return serveFile(req, path.join(dirname, '..', url.pathname));
	}

	return handler(req);
});
