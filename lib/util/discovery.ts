import { usePublicRecord, ViewerRecord } from "@self.id/framework";
import { DefinitionContentType } from "@glazed/did-datastore";
import { CoreModelTypes } from "@self.id/core";
import { useState, useEffect } from "react";
import Web3 from "web3";

/**
 * A convenience type representing a writable ceramic record for a user's
 * crypto accounts.
 */
export type CryptoAccountsRecord = ViewerRecord<DefinitionContentType<CoreModelTypes, "cryptoAccounts">>;

/**
 * Determines whether the indicated Ethereum contract is a deployed instance of
 * the Idea smart contract.
 */
export const isIdeaContract = (web3: Web3, ideaAddr: string, exemplarBytecode: string): Promise<boolean> =>
	web3.eth.getCode(ideaAddr)
		.then((code) => code == exemplarBytecode);

/**
 * Write the given address to the list of owned crypto accounts stored in the
 * provided ceramic document.
 */
export const saveIdea = (
	ideaAddr: string,
	record: CryptoAccountsRecord,
): Promise<void> => 
	// TODO: Work on identifying cryptographic non-guarantees, and terminating this
	// non-null document link
	record.merge({ [`${ideaAddr}@eip155:1`]: "ceramic://todo" });

/**
 * Gets a list of the addresses of idea contracts owned by the given
 * address from ceramic.
 */
export const useOwnedIdeas = (did: string, web3: Web3, filterInstanceOf: string): string[] => {
	// Ceramic supports storing a document with a list of links to ethereum addresses
	// Some of these might be addresses to vision-compatible tokens
	const cryptoAccountsRecord = usePublicRecord("cryptoAccounts", did);

	// Cache items that have already been checked to be owned by the user
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [targetBytecode, setTargetBytecode] = useState<string>(null);

	// Check ownership of any new contracts that appeared
	useEffect(() => {
		// All contracts owned by the user must be instances of a global Idea contract.
		// Load this desired bytecode
		if (targetBytecode == null) {
			setTargetBytecode("");

			web3.eth.getCode(filterInstanceOf)
				.then((code) => setTargetBytecode(code));
		}

		// No possible way of determining owned tokens
		if (targetBytecode == "" || !did || did == "" || !web3 || !cryptoAccountsRecord || cryptoAccountsRecord.isLoading || cryptoAccountsRecord.isError || !cryptoAccountsRecord.content)
			return;

		for (const accLink of Object.keys(cryptoAccountsRecord.content)) {
			const possibleAddr = /(0x.*)@/.exec(accLink);

			// Check that an ethereum address was found
			if (possibleAddr.length < 2)
				continue;

			// Now check that the address contains an instance of the Ideas contract
			const addr = possibleAddr[1];

			// Skip cached items
			if (checked.has(addr))
				continue;

			isIdeaContract(web3, addr, targetBytecode)
				.then((valid) => {
					// The address is an instance of the Idea contract!
					if (valid)
						setChecked(new Set([...checked, addr]));
				});
		}
	});

	return [...checked];
};
