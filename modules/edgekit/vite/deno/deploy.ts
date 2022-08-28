import { handler } from 'edgekit:entry-server';
import { manifest } from 'edgekit:manifest';
import * as path from 'https://deno.land/std@0.152.0/path/mod.ts';
import { serve } from 'https://deno.land/std@0.152.0/http/server.ts';
import { serveFile } from 'https://deno.land/std@0.152.0/http/file_server.ts';

import type { ConnInfo } from 'https://deno.land/std@0.152.0/http/server.ts';

const _dirname = path.dirname(path.fromFileUrl(import.meta.url));

serve((request: Request, conn_info: ConnInfo) => {
	const url = new URL(request.url);

	if (url.pathname.startsWith('/' + manifest.namespace)) {
		return serveFile(
			request,
			path.join(_dirname, '../client', url.pathname.replace(/^\//, '')),
		);
	}

	return handler({ request, url, platform: { conn_info } });
});
