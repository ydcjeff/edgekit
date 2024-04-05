/**
 * @module
 *
 * This module is a dummy module to make Deno happy. This module id is aliased
 * in the `ezedge` Vite plugin.
 */

type MaybePromise<T> = T | Promise<T>;
type _RequestHandler = (req: Request) => MaybePromise<Response>;
type RequestHandler = RuntimeConfig extends {
	handler: infer H extends _RequestHandler;
}
	? H
	: (req: Request) => MaybePromise<Response>;

/**
 * Runtime specific module augmentation. It can be used to augment
 *
 * - `handler`
 */
// deno-lint-ignore no-empty-interface
export interface RuntimeConfig {
	// handler: RequestHandler
}

/**
 * This is an internal dummy request handler.
 * This module gets aliased in Vite pipeline.
 */
export const handler: RequestHandler = () =>
	new Response(
		'This is likely a bug of ezedge. Please report on GitHub https://github.com/ydcjeff/ezedge',
	);
