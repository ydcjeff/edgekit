const encoder = /* @__PURE__ */ new TextEncoder();

/**
 * The SHA hash function.
 *
 * @param {Uint8Array | string} data data to hash
 * @param {'sha-1' | 'sha-256' | 'sha-384' | 'sha-512'} algo default SHA-1
 */
export async function sha(data, algo = 'sha-1') {
	data = typeof data === 'string' ? encoder.encode(data) : data;
	const buf = await crypto.subtle.digest(algo, data);

	return Array.from(new Uint8Array(buf))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * The fnv-1a hash function took from https://deno.land/std/http/file_server.ts
 *
 * @param {string | Uint8Array} buf
 */
export function fnv1a(buf) {
	let hash = 2166136261; // 32-bit FNV offset basis
	if (typeof buf === 'string') {
		for (let i = 0; i < buf.length; i++) {
			hash ^= buf.charCodeAt(i);
			// Equivalent to `hash *= 16777619` without using BigInt
			// 32-bit FNV prime
			hash +=
				(hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
		}
	} else {
		for (let i = 0; i < buf.length; i++) {
			hash ^= buf[i];
			// Equivalent to `hash *= 16777619` without using BigInt
			// 32-bit FNV prime
			hash +=
				(hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
		}
	}

	// 32-bit hex string
	return (hash >>> 0).toString(16);
}
