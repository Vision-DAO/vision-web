import { create } from "ipfs-core";
import { createContext, useContext, useEffect, useState } from "react";
import { useConnStatus, networkIdeasTopic, Network, explorers } from "./networks";
import { Message } from "ipfs-core-types/src/pubsub";
import { IdeaDetailProps, MarketMetrics, OnlyIdeaDetailProps } from "../../components/workspace/IdeaDetailCard";
import { IdeaBubbleProps } from "../../components/workspace/IdeaBubble";
import Idea from "../../value-tree/build/contracts/Idea.json";
import Web3 from "web3";

/**
 * A global context providing an instance of IPFS.
 */
export const IpfsContext: React.Context<Awaited<ReturnType<typeof create>>> = createContext(undefined);

/**
 * Types of data recognizable and renderable on the Vision UI.
 * file-blob by default.
 */
export type ItemDataKind = "utf-8" | "image-blob" | "file-blob" | "url-link";

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
 * Fills out an Idea's bubble info to load the idea's card display.
 */
export const loadExtendedIdeaInfo = async (network: Network, w: Web3, basicDetails: IdeaBubbleProps): Promise<IdeaDetailProps> => {
	// TODO: Load market info from uniswap with The Graph,
	// and use pubsub topics for individual contracts to aggregate info about
	// market info (don't scan through history if it can be avoided)
	const metrics: MarketMetrics = { newProposals: 0, deltaPrice: 0, finalizedProposals: 0 };

	const contract = new w.eth.Contract(Idea.abi, basicDetails.addr);

	// TODO: Cache using gossip information,
	// 1000 blocks is not enough to load all info
	const ideaLogs = await contract.getPastEvents("allEvents", { fromBlock: (await w.eth.getBlockNumber()) - 500, toBlock: "latest" });

	let creationDate = new Date();

	// The very first event from the contract indicates when it was created
	for (const log of ideaLogs) {
		creationDate = new Date((await w.eth.getBlock(log.blockNumber)).timestamp as number * 1000);

		break;
	}

	const extendedInfo: OnlyIdeaDetailProps = {
		marketCap: 0,
		price: 0,
		explorerURI: explorers[network],
		createdAt: creationDate,
		nChildren: await contract.methods.numChildren().call()
	};

	return { ...metrics, ...basicDetails, ...extendedInfo };
};

/**
 * Decodes the indicated raw IPFS data as a UTF-8 string.
 */
export const decodeIdeaDataUTF8 = (d: Uint8Array): string => {
	const dec = new TextDecoder("utf-8");

	return dec.decode(d);
};

/**
 * A hook providing a component with an up-to-date list of the most popular root ideas on vision,
 * and a hook for advertising new parents on vision.
 */
export const useParents = (defaults?: Map<string, string[]>): [string[], (ideaAddr: string) => void] => {
	// IPFS provides a pub/sub mechanism that we can use for discovery
	const ipfs = useContext(IpfsContext);
	const [ideas, setIdeas] = useState<Set<string>>(new Set());

	// Segregate IPFS data by network
	const [connInfo, ] = useConnStatus();

	if (!ipfs)
		return [[...ideas, ...defaults.get(connInfo.network)], () => ({})];

	// TODO: Validation before registration in browser
	const handleIdea = (msg: Message) => {
		const dec = new TextDecoder("utf-8");
		const idea = dec.decode(msg.data);

		if (!ideas.has(idea))
			setIdeas(new Set([...ideas, idea]));
	};

	// Collect up-to-date information on the root-level ideas stored on vision
	useEffect(() => {
		const topic = networkIdeasTopic(connInfo);
		ipfs.pubsub.subscribe(topic, handleIdea);

		return () => {
			ipfs.pubsub.unsubscribe(topic, handleIdea);
		};
	});

	// Allow the user to publish ideas via the callback
	return [[...ideas, ...defaults.get(connInfo.network)], (ideaAddr: string) => {
		const enc = new TextEncoder();

		ipfs.pubsub.publish(networkIdeasTopic(connInfo), enc.encode(ideaAddr));
	}];
};

/**
 * Loads all available data at a given IPFS path.
 */
export const getAll = async (ipfs: Awaited<ReturnType<typeof create>>, url: string): Promise<Uint8Array> => {
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
