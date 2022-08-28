/** @param {string} s */
export function valid_id(s) {
	return s.replace(/[^\w]/g, '').slice(-10);
}
