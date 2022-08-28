// @ts-nocheck

import * as http_status from './http_status.js';
import * as http_status_text from './http_status_text.js';
import { respond_data } from './respond.js';
import { assert, describe, test } from 'vitest';

const req_url = 'https://test.com';

describe('respond_data', () => {
	test('GET only, no POST', async () => {
		const resp = await respond_data(
			{ request: new Request(req_url, { method: 'POST' }) },
			{ GET() {} },
		);

		assert.strictEqual(resp.status, http_status.MethodNotAllowed);
		assert.strictEqual(resp.statusText, http_status_text.MethodNotAllowed);
		assert.strictEqual(await resp.text(), 'POST method not allowed');
		assert.strictEqual(resp.headers.get('allow'), 'GET');
	});

	test('GET and DELETE only, no PATCH', async () => {
		const resp = await respond_data(
			{ request: new Request(req_url, { method: 'PATCH' }) },
			{ GET() {}, DELETE() {} },
		);

		assert.strictEqual(resp.status, http_status.MethodNotAllowed);
		assert.strictEqual(resp.statusText, http_status_text.MethodNotAllowed);
		assert.strictEqual(await resp.text(), 'PATCH method not allowed');
		assert.strictEqual(resp.headers.get('allow'), 'GET, DELETE');
	});

	test('response has etag', async () => {
		const resp = await respond_data(
			{ request: new Request(req_url) },
			{ GET: () => ['abc', { headers: {} }] },
		);

		assert.ok(resp.headers.get('etag'));
	});

	test('cache-control is preserved', async () => {
		const resp = await respond_data(
			{ request: new Request(req_url) },
			{ GET: () => ['abc', { headers: { 'cache-control': 'public' } }] },
		);

		assert.strictEqual(resp.headers.get('cache-control'), 'public');
	});

	test('etag should not set', async () => {
		const resp = await respond_data(
			{ request: new Request(req_url) },
			{ GET: () => ['abc', { headers: { 'cache-control': 'no-store' } }] },
		);

		assert.ok(!resp.headers.has('etag'));
	});
});
