import * as fs from 'node:fs';
import * as path from 'node:path';

const s = JSON.stringify;

const tmpl = (body = '', head = '', html_attrs = '', body_attrs = '') =>
	// @ts-expect-error tp is provided via virtual module during dev and
	// from transformed index.html at build time.
	tp
		.replace('<html', '<html ' + html_attrs)
		.replace('<body', '<body ' + body_attrs)
		.replace('</head>', head + '</head>')
		.replace('</body>', body + '</body>');

/**
 * @param {string} template
 * @param {string} namespace
 * @param {string} ec
 */
export function stringify_manifest(template, namespace, ec) {
	return (
		`const tp = ${s(template)};\n` +
		`export const manifest = {
			namespace: ${s(namespace)},
			_ec: ${s(ec)},
			_tmpl: ${tmpl}
		}`
	);
}

/**
 * @param {string} entry
 * @param {string[]} exts
 */
export function get_entry(entry, exts = ['.js', '.ts']) {
	for (const ext of exts) {
		if (entry.endsWith(ext)) {
			return entry;
		}
	}

	const ext = exts.find((ext) => fs.existsSync(entry + ext));

	if (!ext) {
		throw new Error(`missing "${entry}.{js,ts}"`);
	}

	return entry + ext;
}

/** @param {string} input */
export function make_rollup_input(input) {
	const basename = path.basename(input);
	if (basename.endsWith('.js') || basename.endsWith('.ts')) {
		return {
			[basename.replace(path.extname(input), '')]: input,
		};
	}
	return {
		[basename]: get_entry(input),
	};
}
