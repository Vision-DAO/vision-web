import { create } from "ipfs-core";
import { createContext } from "react";

/**
 * A global context providing an instance of IPFS.
 */
export const IpfsContext: React.Context<Awaited<ReturnType<typeof create>>> = createContext(undefined);

/**
 * Loads all available data at a given IPFS path.
 */
export const getAll = async (ipfs: Awaited<ReturnType<typeof create>>, url: string): Promise<Uint8Array> => {
	const stream = ipfs.get(url);
	let blob: Uint8Array = new Uint8Array();

	for await (const chunk of stream) {
		// Append the new chunk to the existing chunks
		const sink = new Uint8Array(blob.length + chunk.length);
		sink.set(blob);
		sink.set(chunk, blob.length);

		blob = sink;
	}

	return blob;
};
