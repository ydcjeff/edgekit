declare module 'edgekit:entry_server' {
	export const handler: import('./index').RequestHandler;
}

declare module 'edgekit:metadata' {
	/** Random UUID for the current build. */
	export const build_id: string;

	/** @internal */
	export const _: {
		assets_dir: string;
		entries: {
			js: string[];
			css: string[];
		};
		tmpl(
			body: string,
			head: string,
			html_attrs?: string,
			body_attrs?: string,
		): string;
	};
}
