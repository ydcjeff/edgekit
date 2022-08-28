import { serialise_csp } from './csp.js';
import { assert, describe, test } from 'vitest';

describe('serialise_csp', () => {
	test(`default-src 'self'`, () => {
		assert.strictEqual(serialise_csp(), `default-src 'self'`);
	});

	test(`default-src 'self'; script-src 'self' https://test.com`, () => {
		assert.strictEqual(
			serialise_csp({
				'script-src': [`'self'`, 'https://test.com'],
			}),
			`default-src 'self'; script-src 'self' https://test.com`,
		);
	});
});
