import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert, describe, test } from 'vitest';
import { get_entry } from './utils.js';

/** @param {string} i */
const r = (i) => path.resolve(__dirname, i);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('get_entry', () => {
	test('./_testdata/a', () => {
		assert.strictEqual(
			get_entry(r('./_testdata/a')),
			r('./_testdata/a.js'),
		);
	});

	test('./_testdata/b', () => {
		assert.strictEqual(
			get_entry(r('./_testdata/b')),
			r('./_testdata/b.ts'),
		);
	});

	test('./_testdata/c', () => {
		assert.throws(() => {
			get_entry('./_testdata/c');
		}, `missing "./_testdata/c.{js,ts}"`);
	});
});
