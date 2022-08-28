import * as path from 'node:path';
import { get_entry, make_rollup_input } from './utils.js';
import { fileURLToPath } from 'node:url';
import { assert, describe, test } from 'vitest';

/** @param {string} i */
const r = (i) => path.resolve(__dirname, i);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('get_entry', () => {
	test('./_testdata/a', () => {
		assert.strictEqual(get_entry(r('./_testdata/a')), r('./_testdata/a.js'));
	});

	test('./_testdata/b', () => {
		assert.strictEqual(get_entry(r('./_testdata/b')), r('./_testdata/b.ts'));
	});

	test('./_testdata/c', () => {
		assert.throws(() => {
			get_entry('./_testdata/c');
		}, `missing "./_testdata/c.{js,ts}"`);
	});
});

describe('make_rollup_input', () => {
	test('./_testdata/a', () => {
		assert.deepEqual(make_rollup_input(r('./_testdata/a')), {
			a: r('./_testdata/a.js'),
		});
	});

	test('./_testdata/b', () => {
		assert.deepEqual(make_rollup_input(r('./_testdata/b')), {
			b: r('./_testdata/b.ts'),
		});
	});

	test('./_testdata/a.js', () => {
		assert.deepEqual(make_rollup_input(r('./_testdata/a.js')), {
			a: r('./_testdata/a.js'),
		});
	});

	test('./_testdata/b.js', () => {
		assert.deepEqual(make_rollup_input(r('./_testdata/b.ts')), {
			b: r('./_testdata/b.ts'),
		});
	});

	test('./_testdata/c', () => {
		assert.throws(() => {
			make_rollup_input('./_testdata/c');
		}, `missing "./_testdata/c.{js,ts}"`);
	});
});
