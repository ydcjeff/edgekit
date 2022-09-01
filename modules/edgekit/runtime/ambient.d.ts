declare module 'edgekit:entry-server' {
	export const respond: import('./index').RequestHandler;
}

declare module 'edgekit:manifest' {
	export const manifest: import('./index').Manifest;
}
