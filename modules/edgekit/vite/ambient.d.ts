declare module 'edgekit:entry-server' {
	export const handler: import('../runtime/index').RequestHandler;
}

declare module 'edgekit:manifest' {
	export const manifest: import('../runtime/index').Manifest;
}
