declare module 'edgekit:entry-server' {
	export const handler: import('./index').RequestHandler;
}

declare module 'edgekit:manifest' {
	export const manifest: import('./index').Manifest;
}
