import { create } from "ipfs-core";
import { createContext, useContext, useEffect, useState } from "react";
import { useConnStatus, networkIdeasTopic } from "./networks";
import { Message } from "ipfs-core-types/src/pubsub";

/**
 * A global context providing an instance of IPFS.
 */
export const IpfsContext: React.Context<Awaited<ReturnType<typeof create>>> = createContext(undefined);

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
