import { create } from "ipfs-core";
import { deserialize } from "bson";
import { createContext, useContext, useEffect, useState } from "react";
import { usePublicRecord, useClient } from "@self.id/framework";
import { blobify } from "./blobify";
import { useWeb3 } from "./web3";
import { useGraph, useStream } from "./graph";
import { GetUserBalanceQuery, Scalars } from "../../.graphclient";
import { chainId, IdxContext, explorers, useConnStatus } from "./networks";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";
import { BasicProfile } from "@datamodels/identity-profile-basic";
import { AbiItem } from "web3-utils";
import { useRouter } from "next/router";

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
		if (d.kind === "image-blob") {
			const data = deserialize(d.data, { promoteBuffers: true }) as FileData;

			const blob = blobify(window, data.contents, null);
			return blob;
		}
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
		const deserialized = deserialize(rawData, {
			promoteBuffers: true,
		}) as IdeaData[];

		if (Array.isArray(deserialized)) data = deserialized;
		else data = Object.values(deserialized);
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
 * Loads the image of the DAO via IPFS.
 */
export const useIdeaImage = (ipfsAddr: string): string | undefined => {
	const [cache, setCache] = useContext(IpfsStoreContext);
	const ipfs = useContext(IpfsContext);

	useEffect(() => {
		if (!ipfsAddr || ipfsAddr === "") return;

		if (ipfsAddr in cache && "icon" in cache[ipfsAddr]) return;

		(async () => {
			const icon = await loadIdeaImageSrc(ipfs, ipfsAddr);
			setCache(ipfsAddr, "icon", icon);
		})();
	}, [ipfsAddr]);

	if (ipfsAddr in cache && "icon" in cache[ipfsAddr])
		return cache[ipfsAddr]["icon"] as string;

	return undefined;
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

/**
 * Gets the ceramic profile of the user.
 */
export const useCeramicId = (addr: string): string | undefined => {
	const [id, setId] = useState<string | undefined>(undefined);

	const [, eth] = useWeb3();
	const client = useClient();

	// Load the user's ceramic ID
	useEffect(() => {
		(async () => {
			const netV = await chainId(eth);
			const link = await Caip10Link.fromAccount(
				client.ceramic,
				`eip155:${netV}:${addr}`
			);

			if (!link || !link.did) return;

			setId(link.did);
		})();
	}, [addr]);

	return id;
};

/**
 * Gets the username of the user with the indicated ethereum address.
 */
export const useUserName = (addr: string): string | undefined => {
	const id = useCeramicId(addr);
	const profile = usePublicRecord("basicProfile", id);

	return id ? profile.content?.name ?? undefined : undefined;
};

/**
 * Displays the profile picture of the user with the indicated address, or
 * returns undefined.
 */
export const useUserPic = (addr: string): string | undefined => {
	const [image, setImage] = useState<string | undefined>(undefined);
	const id = useCeramicId(addr);
	const profile = usePublicRecord("basicProfile", id);

	const ipfs = useContext(IpfsContext);
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);

	// Load the user's profile picture
	useEffect(() => {
		if (id === undefined) return;

		if (!profile.content?.image.original.src) {
			setImage(undefined);

			return;
		}

		const imgCid = profile.content.image.original.src;

		if (imgCid in ipfsCache && "icon" in ipfsCache[imgCid]) {
			setImage(ipfsCache[imgCid]["icon"] as string);

			return;
		}

		// Load in the image
		getAll(ipfs, imgCid.replaceAll("ipfs://", "")).then((imgBlob) => {
			// Turn the image data into an src, and update the UI
			const blob = blobify(window, imgBlob, null);

			setIpfsCache(imgCid, "icon", blob);
			setImage(blob);
		});
	}, [profile.content?.image?.original.src, id]);

	return image;
};

/**
 * Loads the profiles of all users specified.
 */
export const useProfiles = (
	addrs: string[]
): { [addr: string]: BasicProfile } => {
	const [profiles, setProfiles] = useState<{ [addr: string]: BasicProfile }>(
		{}
	);
	const [, eth] = useWeb3();
	const [idx] = useContext(IdxContext);
	const client = useClient();

	// Loads the cermaic profiles of all specified users
	useEffect(() => {
		(async () => {
			const netV = await chainId(eth);

			// Load user ID's in parallel
			await Promise.all(
				addrs.map(async (addr: string) => {
					const link = await Caip10Link.fromAccount(
						client.ceramic,
						`eip155:${netV}:${addr}`
					);
					if (!link || !link.did) return;

					const profile = await idx.get("basicProfile", link.did);
					if (!profile) return;

					setProfiles((profiles) => {
						return { ...profiles, [addr]: profile as BasicProfile };
					});
				})
			);
		})();
	}, [addrs.length]);

	return profiles;
};

/**
 * Gets the ticker symbol of the specified ERC-20, or returns an empty string..
 */
export const useSymbol = (addr: string): string => {
	// See previous TODO on modularity
	const erc20Abi: AbiItem[] = [
		{
			constant: true,
			inputs: [],
			name: "symbol",
			outputs: [{ name: "", type: "string" }],
			payable: false,
			stateMutability: "view",
			type: "function",
		},
	];
	const [web3] = useWeb3();
	const [symbol, setSymbol] = useState<string>("");

	useEffect(() => {
		if (addr === "") return;

		(async () => {
			try {
				const contract = new web3.eth.Contract(erc20Abi, addr);
				const symbol = await contract.methods.symbol().call();

				setSymbol(symbol);
			} catch (e) {
				console.warn(e);

				setSymbol("");
			}
		})();
	}, [addr]);

	return symbol;
};

/**
 * Gets the title of the given DAO, or the name of the given user.
 */
export const useActorTitleNature = (
	addr: string
): [string, "user" | "dao" | "addr"] => {
	const graph = useGraph();

	const [daoTitle, setDaoTitle] = useState<string | null>(null);
	const username = useUserName(addr);

	useEffect(() => {
		(async () => {
			setDaoTitle((await graph.GetDaoTitle({ id: addr })).idea?.name);
		})();
	}, [addr]);

	if (daoTitle) return [daoTitle, "dao"];
	else if (username) return [username, "user"];

	return [addr, "addr"];
};

export const useActorTitle = (addr: string): string =>
	useActorTitleNature(addr)[0];

/**
 * Gets the IPFS address associated with the idea.
 */
export const useIdeaIpfsAddr = (addr: string): string => {
	const graph = useGraph();

	const [ipfsAddr, setIpfsAddr] = useState<string>("");

	useEffect(() => {
		(async () => {
			setIpfsAddr((await graph.GetIpfsAddr({ id: addr })).idea?.ipfsAddr);
		})();
	}, [addr]);

	return ipfsAddr;
};

/**
 * Gets the binary data associated with the IPFS content at the specified CID.
 */
export const useIdeaBinaryData = (cid: string): IdeaData[] => {
	const [data, setData] = useState([]);
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);
	const ipfs = useContext(IpfsContext);

	useEffect(() => {
		if (!cid) return;

		if (cid in ipfsCache && "all" in ipfsCache[cid]) {
			setData(ipfsCache[cid]["all"] as IdeaData[]);

			return;
		}

		(async () => {
			const loaded = await loadIdeaBinaryData(ipfs, cid);
			setIpfsCache(cid, "all", loaded);
			setData(loaded);
		})();
	}, [cid]);

	return data;
};

/**
 * Generates a link to click on the indicated asset, be it a normal address, a
 * user, or a DAO.
 */
export const useActionLink = (
	addr: string,
	router: ReturnType<typeof useRouter>
): (() => void) => {
	const [, nature] = useActorTitleNature(addr);
	const [conn] = useConnStatus();

	return {
		user: () => router.push(`/profile/${addr}`),
		dao: () => router.push(`/ideas/${addr}`),
		addr: () => window.open(`${explorers[conn.network]}/address/${addr}`),
	}[nature];
};

/**
 * Gets the balance of the user belonging to the dao indicated with the provided
 * ETH address.
 */
export const useUserBalance = (addr: string, daoAddr: string): number => {
	const stream = useStream<GetUserBalanceQuery>(
		{ investorProfile: { balance: 0 as unknown as Scalars["BigInt"] } },
		(graph) =>
			graph.GetUserBalance({
				iID: `i${addr}:${daoAddr}`,
			}) as unknown as Promise<AsyncIterable<GetUserBalanceQuery>>,
		[addr, daoAddr]
	);

	const [prevValue, setPrevValue] = useState<number>(0);

	useEffect(() => {
		const newB = stream.investorProfile?.balance;

		if (newB) setPrevValue(Number(newB));
	}, [stream.investorProfile?.balance]);

	return Number(stream.investorProfile?.balance ?? prevValue);
};
