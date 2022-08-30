/**
 * Creates an iterator over the single given element, or returns the element
 * if it is an iterator itself.
 */
export const orSingleIter = <T>(
	v: null | AsyncIterable<T> | T
): AsyncIterable<T> => {
	if (v === null) return [][Symbol.asyncIterator]();
	if (Symbol.iterator in Object(v)) return v as AsyncIterable<T>;

	return [v][Symbol.asyncIterator]();
};
