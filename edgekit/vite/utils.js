import * as fs from 'node:fs';

const s = JSON.stringify;
const BUILD_ID = crypto.randomUUID().slice(0, 8);

export { get_entry, is_server_build, mkdirp, stringify_metadata };

function stringify_metadata({
	assets_dir = '',
	template = '',
	entry_client = '',
} = {}) {
	return (
		`export const build_id = ${s(BUILD_ID)};\n`
		+ `const t = ${s(template)};\n`
		+ `export const _ = {
		assets_dir: ${s(assets_dir)},
		entry: ${s(entry_client)},
		tmpl: ${tmpl},
	};`
	);
}

function tmpl(body = '', head = '', html_attrs = '', body_attrs = '') {
	// @ts-expect-error This `t` is from above metadata.
	return /** @type {string} */ (t)
		.replace('<html', '<html ' + html_attrs)
		.replace('<body', '<body ' + body_attrs)
		.replace('</head>', head + '</head>')
		.replace('</body>', body + '</body>');
}

/**
 * @param {string} entry
 * @param {string[]} exts
 */
function get_entry(entry, exts = ['.js', '.ts']) {
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

/** @param {string} dir */
function mkdirp(dir) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	}
	catch (/** @type {any} */ e) {
		if (e.code === 'EEXIST') return;
		throw e;
	}
}

/**
 * @param {import('vite').UserConfig} config
 * @param {import('vite').ConfigEnv} env
 */
function is_server_build({ build }, { command }) {
	return !!build?.ssr && command === 'build';
}
