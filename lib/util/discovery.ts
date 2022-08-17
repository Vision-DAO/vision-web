import { usePublicRecord, ViewerRecord } from "@self.id/framework";
import { ModelTypeAliases } from "@glazed/types";
import { DefinitionContentType } from "@glazed/did-datastore";
import { useState, useEffect } from "react";
import { getAllIdeaDescendants, IpfsClient, FundingRate } from "./ipfs";
import { staticIdeas } from "../../pages/index";
import { ConnStatus, useConnStatus } from "./networks";
import Idea from "../../value-tree/build/contracts/Idea.json";
import Web3 from "web3";

// A model representing a ceramic record storing the items owned by the user
export type OwnedItemAddressesList = {
	items: string[];
};

// A model representing a ceramic record storing the items watched by the user
export type WatchedItemAddressesList = {
	items: string[];
};

// All model representations of ceramic models depended on by vision
export type ModelTypes = ModelTypeAliases<
	{
		OwnedItemAddressesList: OwnedItemAddressesList;
		WatchedItemAddressesList: WatchedItemAddressesList;
	},
	{
		visionOwnedItemAddressesList: "OwnedItemAddressesList";
		visionWatchedItemAddressesList: "WatchedItemAddressesList";
	}
>;

/**
 * Convenience types representing writable ceramic records for a user's
 * crypto accounts.
 */
export type OwnedIdeasRecord = ViewerRecord<
	DefinitionContentType<ModelTypes, "visionOwnedItemAddressesList">
>;
export type WatchedIdeasRecord = ViewerRecord<
	DefinitionContentType<ModelTypes, "visionWatchedItemAddressesList">
>;

/**
 * Traverses a list of root addresses, collecting their children in a returned
 * set of addresses. Avoids circular loops by remembering visited nodes in a
 * `visited` set. Including addresses in the `visited` set can also be used to
 * filter out bad addresses that shouldn't be visited at all.
 */
export const useTraversedChildIdeas = (
	roots: string[],
	web3: Web3,
	ipfs: IpfsClient,
	visited: string[]
): { [addr: string]: { [parent: string]: FundingRate } } => {
	const [children, setChildren] = useState<{
		[addr: string]: { [parent: string]: FundingRate };
	}>({});
	const [conn] = useConnStatus();

	// Traverse the graph in a depth first, recursive fashion
	useEffect(() => {
		(async () => {
			for (const root of roots) {
				const { found: rootFound } = await getAllIdeaDescendants(
					root,
					web3,
					new Set(visited),
					ipfs,
					conn
				);
				setChildren((children) =>
					Object.entries(rootFound).reduce((ideas, [k, v]) => {
						return { ...ideas, [k]: v };
					}, children)
				);
			}
		})();
	}, [roots.reduce((sum, x) => sum + x, "")]);

	return children;
};

/**
 * Gets the name of an idea, or its address if it isn't an Idea.
 */
export const resolveIdeaName = async (
	web3: Web3,
	conn: ConnStatus,
	ideaAddr: string
): Promise<string> => {
	const ideaBytecode = await web3.eth.getCode(
		staticIdeas.get(conn.network)[0]
	);

	if (!ideaBytecode) return ideaAddr;

	if (await isIdeaContract(web3, ideaAddr, ideaBytecode)) {
		const contract = new web3.eth.Contract(Idea.abi, ideaAddr);
		return await contract.methods.name().call();
	}

	return ideaAddr;
};

/**
 * Determines whether the indicated Ethereum contract is a deployed instance of
 * the Idea smart contract.
 */
export const isIdeaContract = (
	web3: Web3,
	ideaAddr: string,
	exemplarBytecode: string
): Promise<boolean> => {
	return web3.eth.getCode(ideaAddr).then((code) => code == exemplarBytecode);
};

/**
 * Write the given address to the list of owned crypto accounts stored in the
 * provided ceramic document.
 */
export const saveIdea = async (
	ideaAddr: string,
	record: OwnedIdeasRecord
): Promise<void> => {
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: [...(record.content ? record.content.items : []), ideaAddr],
	});
};

/**
 * Write the given address to the list of watched crypto accounts stored in the
 * provided ceramic document.
 */
export const watchIdea = async (
	ideaAddr: string,
	record: WatchedIdeasRecord
): Promise<void> => {
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: [...(record.content ? record.content.items : []), ideaAddr],
	});
};

/**
 * Removed the given address to the list of watched crypto accounts stored in the
 * provided ceramic document.
 */
export const unwatchIdea = async (
	ideaAddr: string,
	record: WatchedIdeasRecord
): Promise<void> => {
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	return await record.set({
		items: record.content?.items.filter((addr) => addr != ideaAddr) ?? [],
	});
};

/**
 * Gets a list of the addresses of idea contracts owned by the given
 * address from ceramic.
 */
export const useOwnedIdeas = (
	did: string,
	web3: Web3,
	filterInstanceOf: string
): Set<string> => {
	//TODO: Replace with new record type
	// Ceramic supports storing a document with a list of links to ethereum addresses
	// Some of these might be addresses to vision-compatible tokens
	const watchedIdeasRecord = usePublicRecord<ModelTypes>(
		"visionOwnedItemAddressesList",
		did
	);

	// Cache items that have already been checked to be owned by the user
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [blocked, setBlocked] = useState<Set<string>>(new Set());
	const [targetBytecode, setTargetBytecode] = useState<string>(null);

	// Check ownership of any new contracts that appeared
	useEffect(() => {
		// All contracts owned by the user must be instances of a global Idea contract.
		// Load this desired bytecode
		if (targetBytecode == null) {
			setTargetBytecode("");

			web3.eth
				.getCode(filterInstanceOf)
				.then((code) => setTargetBytecode(code));
		}

		// No possible way of determining owned tokens
		if (
			targetBytecode == "" ||
			!did ||
			did == "" ||
			!web3 ||
			!watchedIdeasRecord ||
			watchedIdeasRecord.isLoading ||
			watchedIdeasRecord.isError ||
			!watchedIdeasRecord.content
		)
			return;

		// Now check that each address contains an instance of the Ideas contract
		for (const addr of watchedIdeasRecord.content.items) {
			// Skip cached items
			if (blocked.has(addr) || checked.has(addr)) continue;

			isIdeaContract(web3, addr, targetBytecode).then((valid) => {
				// The address is an instance of the Idea contract!
				if (valid) {
					if (!checked.has(addr))
						setChecked((checked) => new Set([...checked, addr]));
				} else {
					if (!blocked.has(addr))
						setBlocked((blocked) => new Set([...blocked, addr]));
				}
			});
		}
	});

	return checked;
};

/**
 * Gets a list of the addresses of idea contracts watched by the given
 * address from ceramic.
 */
export const useWatchedIdeas = (
	did: string,
	web3: Web3,
	filterInstanceOf: string
): Set<string> => {
	//TODO: Replace with new record type
	// Ceramic supports storing a document with a list of links to ethereum addresses
	// Some of these might be addresses to vision-compatible tokens
	const watchedIdeasRecord = usePublicRecord<ModelTypes>(
		"visionWatchedItemAddressesList",
		did
	);

	// Cache items that have already been checked to be owned by the user
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [blocked, setBlocked] = useState<Set<string>>(new Set());
	const [targetBytecode, setTargetBytecode] = useState<string>(null);

	// Check ownership of any new contracts that appeared
	useEffect(() => {
		// All contracts owned by the user must be instances of a global Idea contract.
		// Load this desired bytecode
		if (targetBytecode == null) {
			setTargetBytecode("");

			web3.eth
				.getCode(filterInstanceOf)
				.then((code) => setTargetBytecode(code));
		}

		// No possible way of determining owned tokens
		if (
			targetBytecode == "" ||
			!did ||
			did == "" ||
			!web3 ||
			!watchedIdeasRecord ||
			watchedIdeasRecord.isLoading ||
			watchedIdeasRecord.isError ||
			!watchedIdeasRecord.content
		)
			return;

		// Now check that each address contains an instance of the Ideas contract
		for (const addr of watchedIdeasRecord.content.items) {
			// Skip cached items
			if (blocked.has(addr) || checked.has(addr)) continue;

			isIdeaContract(web3, addr, targetBytecode).then((valid) => {
				// The address is an instance of the Idea contract!
				if (valid) {
					if (!checked.has(addr))
						setChecked((checked) => new Set([...checked, addr]));
				} else {
					if (!blocked.has(addr))
						setBlocked((blocked) => new Set([...blocked, addr]));
				}
			});
		}
	});

	return checked;
};
