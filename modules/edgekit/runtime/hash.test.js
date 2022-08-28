import { fnv1a } from './hash.js';
import { assert, describe, test } from 'vitest';

describe('fnv1a', () => {
	test('fnv1a should have same result', () => {
		const str_result = fnv1a('abc');
		const buf_result = fnv1a(new TextEncoder().encode('abc'));

		assert.strictEqual(str_result, buf_result);
	});
});
