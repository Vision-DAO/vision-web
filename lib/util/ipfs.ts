import { create } from "ipfs-core";
import { serialize, deserialize } from "bson";
import { blobify } from "./blobify";
import { createContext, useContext, useEffect, useState } from "react";
import { useConnStatus, networkIdeasTopic, Network, explorers } from "./networks";
import { isIdeaContract } from "./discovery";
import { Message } from "ipfs-core-types/src/pubsub";
import { MarketMetrics, OnlyIdeaDetailProps, ExtendedIdeaInformation } from "../../components/workspace/IdeaDetailCard";
import { BasicIdeaInformation } from "../../components/workspace/IdeaBubble";
import { staticIdeas } from "../../pages/index";
import Idea from "../../value-tree/build/contracts/Idea.json";
import Prop from "../../value-tree/build/contracts/Prop.json";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";

/**
 * An alias for the type of the IPFS constructor.
 */
export type IpfsClient = Awaited<ReturnType<typeof create>>;

/**
 * A global context providing an instance of IPFS.
 */
export const IpfsContext: React.Context<IpfsClient> = createContext(undefined);

/**
 * A global context providing a cache for proposals.
 */
export const ProposalsContext: React.Context<[{ [addr: string]: GossipProposalInformation[] }, (addr: string, info: GossipProposalInformation) => void]> = createContext([{}, null]);

/**
 * Available gossiped data about a proposal.
 * Users shold manually load contract-related data. See
 * ExtendedProposalInformation for that.
 */
export interface GossipProposalInformation {
	/* Metadata attached to the proposal */
	dataIpfsAddr: string,

	/* The contract address of the proposal */
	addr: string,
}

/**
 * Ideas can be funded with new funds, or existing funds belonging to the
 * controlling smart contract.
 */
export enum FundingKind {
	Treasury,
	Mint
}

/**
 * Represents the details of how an Idea is funded.
 */
export interface FundingRate {
	/* The token used for funding */
	token: string;

	/* The number of tokens left */
	value: number;

	/* How often the funds can be claimed */
	interval: number;

	/* When the funds expire */
	expiry: Date;

	/* When the funds were last claimed */
	lastClaimed: Date;

	/* Where the idea's funds should come from */
	kind: FundingKind,
}

/* TODO: Display information regarding votes - counts, who voted for what */
export interface ExtendedProposalInformation {
	data: IdeaData[],

	addr: string;

	parentAddr: string;
	title: string;

	/* The address of the thing being proposed */
	destAddr: string;

	rate: FundingRate;

	nVoters: number,

	/* When the proposal expires */
	expiry: Date;
}

/**
 * A parsed vote for a proposal.
 */
export interface ProposalVote {
	/* The voter's decision */
	contents: FundingRate,

	/* The nmber of tokens committed to this voted value */
	weight: number,
}

/* All available information from IPFS and smart contract storage about a
 * Proposal */
export type AllProposalInformation = GossipProposalInformation & ExtendedProposalInformation;

/**
 * A global instance of the currently loaded, expanded idea that is guaranteed
 * to be loaded, if the child is rendered.
 */
export const ActiveIdeaContext: React.Context<[ExtendedIdeaInformation, (details: ExtendedIdeaInformation) => void]> = createContext(undefined);

/**
 * A global instance of the currently loaded, expanded proposal that is
 * guaranteed to be loaded, i fthe child is rendered.
 */
export const ActiveProposalContext: React.Context<[ExtendedProposalInformation, (details: ExtendedProposalInformation) => void]> = createContext(undefined);

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
	contents: Uint8Array,
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

export type RawEthPropRate = {
	token: string,
	value: string,
	intervalLength: string,
	expiry: string,
	lastClaimed: string,
	kind: string
};

export type RawEthPropVote = {
	rate: RawEthPropRate,
	votes: string,
};

// Map ethereum-packed enum types to js enums
const fundingKinds = [FundingKind.Treasury, FundingKind.Mint];

const extractRawFundingRate = async (nVoters: number, expired: boolean, w: Web3, propContract: Contract): Promise<RawEthPropRate> => {
	const parentContract = new w.eth.Contract(Idea.abi, await propContract.methods.governed().call());

	if (nVoters > 0) {
		const parentEntry = await parentContract.methods.fundedIdeas(await propContract.methods.toFund().call()).call();

		if (expired && parentEntry.expiry !== "0") {
			return parentEntry;
		}

		return await propContract.methods.finalFundsRate().call();
	}

	return await propContract.methods.rate().call();
};

/**
 * Loads all information available about a proposal from IPFS and ethereum.
 */
export const loadExtendedProposalInfo = async (ipfs: IpfsClient, w: Web3, prop: GossipProposalInformation): Promise<ExtendedProposalInformation> => {
	// Details for a proposal are contained:
	// - on ethereum
	// - on IPFS
	// Load both
	const contract = new w.eth.Contract(Prop.abi, prop.addr);
	const data = await loadIdeaBinaryData(ipfs, await contract.methods.ipfsAddr().call());

	// Ethereum stores structs as packed arrays. Further processing will be necessary
	const nVoters = await contract.methods.nVoters().call();
	const expired = (new Date()) > (await contract.methods.expiresAt().call());

	// Calculate the final rate, or the null rate, depending on if any users voted
	const { token, value, intervalLength: interval, expiry, lastClaimed, kind }: RawEthPropRate = await extractRawFundingRate(nVoters, expired, w, contract);

	const rate: FundingRate = {
		token,
		value: parseInt(value) || 0,
		interval: parseInt(interval) || 0,
		expiry: new Date(parseInt(expiry) || 0 * 1000),
		lastClaimed: new Date(parseInt(lastClaimed) || 0 * 1000),

		// Enums are represented as indices in Ethereum
		kind: fundingKinds[kind],
	};

	return {
		data,
		addr: prop.addr,
		parentAddr: await contract.methods.governed().call(),
		destAddr: await contract.methods.toFund().call(),
		nVoters,
		title: await contract.methods.title().call(),

		// Unix timestamps are / 10000
		expiry: new Date(await contract.methods.expiresAt().call() * 1000),

		rate,
	};
};

/**
 * Gets all of the addresses that voted on a proposal.
 */
export const loadAllProposalVoters = async (web3: Web3, propAddr: string): Promise<string[]> => {
	const contract = new web3.eth.Contract(Prop.abi, propAddr);
	const nVoters = parseInt(await contract.methods.nVoters().call());

	// Collect all addresses that voted
	return await Promise.all(Array.from(Array(nVoters).keys()).map((i: number) => contract.methods.voters(i).call()));
};

/**
 * Loads and parses a vote for a voter for a proposal, or returns NULL if no such
 * vote exists.
 */
export const loadProposalVote = async (web3: Web3, propAddr: string, voterAddr: string): Promise<ProposalVote> => {
	const contract = new web3.eth.Contract(Prop.abi, propAddr);

	try {
		const rawVote: RawEthPropVote = await contract.methods.refunds(voterAddr).call();

		if (!rawVote)
			return null;

		return {
			contents: {
				token: rawVote.rate.token,
				value: parseInt(rawVote.rate.value) || 0,
				interval: parseInt(rawVote.rate.intervalLength) || 0,
				expiry: new Date(parseInt(rawVote.rate.expiry) || 0 * 1000),
				lastClaimed: new Date(parseInt(rawVote.rate.lastClaimed) || 0 * 1000),
				kind: fundingKinds[parseInt(rawVote.rate.kind) || 0],
			},
			weight: parseInt(rawVote.votes) || 0,
		};
	} catch (e) {
		console.warn(e);

		return null;
	}
};

/**
 * Fills out an Idea's bubble info to load the idea's card display.
 */
export const loadExtendedIdeaInfo = async (ipfs: IpfsClient, network: Network, w: Web3, basicDetails: BasicIdeaInformation): Promise<ExtendedIdeaInformation> => {
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

	// All ideas have metadata stored on IPFS
	const ipfsAddr = await contract.methods.ipfsAddr().call();
	const data: IdeaData[] = await loadIdeaBinaryData(ipfs, ipfsAddr);

	// Render nothing if the user did not provide a description
	let description = "";

	for (const d of Object.values(data)) {
		if (d.kind == "utf-8") {
			description = decodeIdeaDataUTF8(d.data);
		}
	}

	// TODO: Load market metrics with The Graph
	const extendedInfo: OnlyIdeaDetailProps = {
		description: description,
		data: data,
		totalSupply: await contract.methods.totalSupply().call(),
		ticker: await contract.methods.symbol().call(),
		marketCap: 0,
		price: 0,
		explorerURI: explorers[network],
		createdAt: creationDate,
		nChildren: await contract.methods.numChildren().call()
	};

	return { ...metrics, ...basicDetails, ...extendedInfo };
};

/**
 * Loads information from IPFS and Ethereum necessary to render a basic idea information bubble.
 */
export const loadBasicIdeaInfo = async (ipfs: IpfsClient, w: Web3, ideaAddr: string): Promise<BasicIdeaInformation> => {
	const contract = new w.eth.Contract(Idea.abi, ideaAddr);

	// Load the idea's image
	let image = undefined;

	// TODO: Abstract this out to prevent re-render
	// (binary data is a dependency for both basic information and extended info yikes)
	const allData = await loadIdeaBinaryData(ipfs, await contract.methods.ipfsAddr().call());

	// Find image data for the idea, and keep the most recently loaded one
	for (const d of Object.values(allData)) {
		if (d.kind === "image-blob") {
			try {
				const f: FileData = deserialize(d.data, { promoteBuffers: true }) as FileData;

				image = blobify(window, f.contents, null);
			} catch (e) {
				console.debug(e);

				image = "";
			}
		}
	}

	return {
		title: await contract.methods.name().call(),
		image: image,
		addr: ideaAddr,
	};
};

/**
 * Loads all of the IPFS data entries available for an idea.
 */
export const loadIdeaBinaryData = async (ipfs: IpfsClient, ipfsAddr: string): Promise<IdeaData[]> => {
	const rawData = await getAll(ipfs, ipfsAddr);

	let data: IdeaData[] = [];

	// Data fields are optional for all ideas
	try {
		data = deserialize(
			rawData,
			{ promoteBuffers: true },
		) as IdeaData[];
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
 * A hook providing a component with an up-to-date list of the most popular root ideas on vision,
 * and a hook for advertising new parents on vision.
 */
export const useParents = (defaults?: Map<string, string[]>): [Set<string>, (ideaAddr: string) => void] => {
	// IPFS provides a pub/sub mechanism that we can use for discovery
	const ipfs = useContext(IpfsContext);
	const [ideas, setIdeas] = useState<Set<string>>(new Set());

	// Segregate IPFS data by network
	const [connInfo, ] = useConnStatus();

	if (!ipfs)
		return [new Set([...ideas, ...defaults.get(connInfo.network)]), () => ({})];

	// TODO: Validation before registration in browser
	const handleIdea = (msg: Message) => {
		const dec = new TextDecoder("utf-8");
		const idea = dec.decode(msg.data);

		if (!ideas.has(idea)) {
			console.debug(`receive idea ${idea} <- ${networkIdeasTopic(connInfo)}`);

			setIdeas(new Set([...ideas, idea]));
		}
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
	return [new Set([...ideas, ...defaults.get(connInfo.network)]), (ideaAddr: string) => {
		const enc = new TextEncoder();

		console.debug(`pub idea ${ideaAddr} -> ${networkIdeasTopic(connInfo)}`);

		ipfs.pubsub.publish(networkIdeasTopic(connInfo), enc.encode(ideaAddr));
	}];
};

/**
 * Listens to the active proposals for an idea via IPFS, and generate a handler
 * for publishing new proposals.
 *
 * TODO: Abstract Idea and Proposal pub/sub
 */
export const useProposals = (ideaAddr: string): [GossipProposalInformation[], (prop: GossipProposalInformation) => void] => {
	const ipfs = useContext(IpfsContext);
	const [proposals, addProposal]: [{ [addr: string]: GossipProposalInformation[] }, (addr: string, prop: GossipProposalInformation) => void] = useContext(ProposalsContext);

	if (!ipfs)
		return [[], () => ({})];

	const handleProp = (msg: Message) => {
		try {
			const prop: GossipProposalInformation = deserialize(msg.data, { promoteBuffers: true }) as GossipProposalInformation;

			if (proposals[ideaAddr].includes(prop))
				return;

			// Append the proposal to the list of proposals
			addProposal(ideaAddr, prop);
		} catch (e) {
			console.warn(e);
		}
	};

	useEffect(() => {
		ipfs.pubsub.subscribe(ideaAddr, handleProp);

		return () => {
			ipfs.pubsub.unsubscribe(ideaAddr, handleProp);
		};
	});

	const pub = (prop: GossipProposalInformation) => {
		ipfs.pubsub.publish(ideaAddr, serialize(prop));
		addProposal(ideaAddr, prop);
	};

	return [proposals[ideaAddr] ?? [], pub];
};

/**
 * Loads basic information and funding rates for all accepted children of the indicated idea.
 */
export const useFundedChildren = (addr: string, web3: Web3, ipfs: IpfsClient): [{ [addr: string]: FundingRate }, { [addr: string]: BasicIdeaInformation }] => {
	const [isValid, setIsValid] = useState<boolean>(undefined);
	const [children, setChildren] = useState<[{ [addr: string]: FundingRate }, { [addr: string]: BasicIdeaInformation }]>([{}, {}]);
	const [numChildren, setNchildren] = useState<number>(0);
	const [conn, ] = useConnStatus();

	// An example of an idea contract. Used for ensuring that this is a valid Idea
	// contract, since a hook cannot be called conditionally - the logic inside
	// it must be
	const exemplar = staticIdeas.get(conn.network)[0];

	useEffect(() => {
		// The idea has not been determined to be an instance of the Idea contract
		if (isValid === undefined) {
			setIsValid(false);

			(async () => {
				setIsValid(await isIdeaContract(web3, addr, await web3.eth.getCode(exemplar)));
			})();
		}

		if (!isValid)
			return;

		(async () => {
			const contract = new web3.eth.Contract(Idea.abi, addr);
			const contractCode = await web3.eth.getCode(exemplar);
			const nChildren = parseInt(await contract.methods.numChildren().call());

			if (numChildren !== nChildren) {
				setNchildren(nChildren);

				return;
			}

			// The children have already been loaded
			if (Object.keys(children[0]).length === numChildren) {
				return;
			}

			const childIndices = Array(nChildren).fill(1).map((v, i) => i);

			// Gets a list of the addresses of children of the contract
			const childAddrs = await Promise.all(childIndices.map((i) => contract.methods.children(i).call()));
			const childRates: [string, RawEthPropRate][] = await Promise.all(childAddrs.map((addr: string) => contract.methods.fundedIdeas(addr).call().then((rate: RawEthPropRate) => [addr, rate])));

			// Convert eth ABI rates into actual rates
			const parsedChildRates: { [addr: string]: FundingRate } = childRates.reduce((prev, [addr, rate]) => { return {
				...prev,
				[addr]: {
					token: rate.token,
					value: parseInt(rate.value) || 0,
					interval: parseInt(rate.intervalLength) || 0,
					expiry: new Date((parseInt(rate.expiry) || 0) * 1000),
					lastClaimed: new Date((parseInt(rate.lastClaimed) || 0) * 1000),

					// Enums are represented as indices in Ethereum
					kind: fundingKinds[rate.kind],
				},
			}; }, {});
			const childIdeaDetails: [string, BasicIdeaInformation][] = await Promise.all(childAddrs.map((addr: string) => {
				return (async (): Promise<[string, BasicIdeaInformation]> => {
					if (await isIdeaContract(web3, addr, contractCode))
						return loadBasicIdeaInfo(ipfs, web3, addr).then((info: BasicIdeaInformation) => { const res: [string, BasicIdeaInformation] = [addr, info]; return res;});

					const res: [string, BasicIdeaInformation] = [addr, { title: `${addr.substring(0, 12)}...`, image: null, addr }];
					return res;
				})();
			}));
			const parsedChildDetails: { [addr: string]: BasicIdeaInformation } = childIdeaDetails.reduce((prev, [addr, details]) => { return { ...prev, [addr]: details }; }, {});

			setChildren([parsedChildRates, parsedChildDetails]);
		})();
	});

	if (!ipfs || !web3)
		return [{}, {}];

	return children;
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
