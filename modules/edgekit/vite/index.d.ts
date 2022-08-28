/// <reference types="./ambient" />

export * from './mod.js';

export interface PluginOptions {
	/**
	 * Path to the entry client file
	 *
	 * @default 'app/entry-client'
	 */
	entry_client?: string;
	/**
	 * Path to the entry server file
	 *
	 * @default 'app/entry-server'
	 */
	entry_server?: string;
	/**
	 * Runtime platform for the server build.
	 */
	runtime?: 'cloudflare' | 'deno' | 'netlify' | 'node' | 'vercel';
}
