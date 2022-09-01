// from https://github.com/sveltejs/kit/blob/master/packages/kit/src/node/index.js
import { webcrypto as crypto } from 'node:crypto';

/** @param {import('http').IncomingMessage} req */
function get_raw_body(req) {
	const headers = req.headers;

	if (!headers['content-type']) {
		return null;
	}

	const length = Number(headers['content-length']);

	// check if no request body
	// https://github.com/jshttp/type-is/blob/c1f4388c71c8a01f79934e68f630ca4a15fffcd6/index.js#L81-L95
	if (isNaN(length) && !headers['transfer-encoding']) {
		return null;
	}

	return new ReadableStream({
		start(controller) {
			req.on('error', (err) => controller.error(err));

			let size = 0;

			req.on('data', (chunk) => {
				size += chunk.length;

				if (size > length) {
					controller.error(new Error('content-length exceeded'));
				}

				controller.enqueue(chunk);
			});

			req.on('end', () => controller.close());
		},
	});
}

/**
 * @param {string} origin
 * @param {import('http').IncomingMessage} req
 */
export function get_request(origin, req) {
	return new Request(origin + req.url, {
		method: req.method,
		headers: /** @type {Record<string, string>} */ (req.headers),
		body: get_raw_body(req),
	});
}

/**
 * @param {import('http').ServerResponse} res
 * @param {Response} response
 */
export async function set_response(res, response) {
	const headers = Object.fromEntries(response.headers);

	if (response.headers.has('set-cookie')) {
		// @ts-expect-error (headers.raw() is non-standard)
		headers['set-cookie'] = response.headers.raw()['set-cookie'];
	}

	res.writeHead(response.status, headers);

	if (response.body) {
		let cancelled = false;

		const reader = response.body.getReader();

		res.on('close', () => {
			reader.cancel();
			cancelled = true;
		});

		const next = async () => {
			const { done, value } = await reader.read();

			if (cancelled) return;

			if (done) {
				res.end();
				return;
			}

			res.write(Buffer.from(value), (error) => {
				if (error) {
					console.error('error writing stream', error);
					res.end();
				} else {
					next();
				}
			});
		};

		next();
	} else {
		res.end();
	}
}

const polyfills = {
	crypto,
};

export function install_polyfills() {
	for (const [k, v] of Object.entries(polyfills)) {
		// eslint-disable-next-line no-undef
		Object.defineProperty(globalThis, k, {
			enumerable: true,
			configurable: true,
			value: v,
		});
	}
}
