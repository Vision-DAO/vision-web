import { create } from "ipfs-core";
import { deserialize } from "bson";
import { createContext, useContext, useEffect } from "react";
import { blobify } from "./blobify";

/**
 * An alias for the type of the IPFS constructor.
 */
export type IpfsClient = Awaited<ReturnType<typeof create>>;

/**
 * A global context providing an instance of IPFS.
 */
export const IpfsContext: React.Context<IpfsClient> = createContext(undefined);

/**
 * A global cache storing object mappings for requested CID's.
 */
export const IpfsStoreContext: React.Context<
	[
		{ [cid: string]: { [kind: string]: unknown } },
		(cid: string, key: string, v: unknown) => void
	]
> = createContext(null);

/**
 * Types of data recognizable and renderable on the Vision UI.
 * file-blob by default.
 */
export type ItemDataKind = "utf-8" | "image-blob" | "file-blob" | "url-link";

/**
 * Data stored as a file as metadata for an idea.
 */
export interface FileData {
	path: string;
	contents: Uint8Array;
}

/**
 * Decoded data associated with an item on Vision.
 */
export interface IdeaData {
	/**
	 * How the item's data should be rendered on vision
	 */
	kind: ItemDataKind;

	/**
	 * The raw data associated with the item
	 */
	data: Uint8Array;
}

/**
 * Extracts the image attached to an idea.
 */
export const loadIdeaImageSrc = async (
	ipfs: IpfsClient,
	ipfsAddr: string
): Promise<string | undefined> => {
	const data = await loadIdeaBinaryData(ipfs, ipfsAddr);

	for (const d of data) {
		if (d.kind === "image-blob") return blobify(window, d.data, null);
	}
	return undefined;
};

/**
 * Extracts the description attached to an idea.
 */
export const loadIdeaDescription = async (
	ipfs: IpfsClient,
	ipfsAddr: string
): Promise<string | undefined> => {
	const data = await loadIdeaBinaryData(ipfs, ipfsAddr);

	for (const d of data) {
		if (d.kind === "utf-8") return decodeIdeaDataUTF8(d.data);
	}
	return undefined;
};

/**
 * Loads all of the IPFS data entries available for an idea.
 */
export const loadIdeaBinaryData = async (
	ipfs: IpfsClient,
	ipfsAddr: string
): Promise<IdeaData[]> => {
	const rawData = await getAll(ipfs, ipfsAddr);

	let data: IdeaData[] = [];

	// Data fields are optional for all ideas
	try {
		data = deserialize(rawData, { promoteBuffers: true }) as IdeaData[];
	} catch (e) {
		console.warn(e);
	}

	return data;
};

/**
 * Decodes the indicated raw IPFS data as a UTF-8 string.
 */
export const decodeIdeaDataUTF8 = (d: Uint8Array): string => {
	const dec = new TextDecoder("utf-8");

	return dec.decode(d);
};

/**
 * Loads all available data at a given IPFS path.
 */
export const getAll = async (
	ipfs: Awaited<ReturnType<typeof create>>,
	url: string
): Promise<Uint8Array> => {
	const stream = ipfs.cat(url);
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

/**
 * Loads the description of the DAO via IPFS.
 */
export const useIdeaDescription = (ipfsAddr: string): string | undefined => {
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);
	const ipfs = useContext(IpfsContext);

	// The description of the DAO is stored on IPFS, off-chain
	useEffect(() => {
		if (ipfsAddr in ipfsCache && "description" in ipfsCache[ipfsAddr]) return;

		// Trigger a load of the description of the DAO
		(async () => {
			const res = await loadIdeaDescription(ipfs, ipfsAddr);

			if (res === undefined) return;

			setIpfsCache(ipfsAddr, "description", res);
		})();
	}, [ipfsAddr]);

	return ipfsAddr in ipfsCache && "description" in ipfsCache[ipfsAddr]
		? (ipfsCache[ipfsAddr]["description"] as string)
		: undefined;
};
