/**
 * Converts arbitrary data into an image src via the window's URL utility.
 */
export const blobify = (window: typeof globalThis, data: Uint8Array, fallback: string) => {
	const gen = window.URL || window.webkitURL;

	// Use the fallback image if a conversion cannot be done (too lazy for
	// polyfills)
	if (!gen)
		return fallback;

	return gen.createObjectURL(new Blob([data]));
};
