import { usePublicRecord } from "@self.id/framework";
import { useState, useEffect } from "react";
import Web3 from "web3";
import Idea from "../../value-tree/build/contracts/Idea.json";

/**
 * Gets a list of the addresses of idea contracts owned by the given
 * address from ceramic.
 */
export const useOwnedIdeas = (did: string, web3: Web3): string[] => {
	// Ceramic supports storing a document with a list of links to ethereum addresses
	// Some of these might be addresses to vision-compatible tokens
	const cryptoAccountsRecord = usePublicRecord("cryptoAccounts", did);

	// Cache items that have already been checked to be owned by the user
	const [checked, setChecked] = useState<Set<string>>(new Set());

	// No possible way of determining owned tokens
	if (!cryptoAccountsRecord || cryptoAccountsRecord.isLoading || cryptoAccountsRecord.isError || !cryptoAccountsRecord.content)
		return [];

	// Check ownership of any new contracts that appeared
	useEffect(() => {
		for (const accLink of Object.keys(cryptoAccountsRecord.content)) {
			const possibleAddr = /0x(.*)@/.exec(accLink);

			// Check that an ethereum address was found
			if (possibleAddr.length < 2)
				continue;

			// Now check that the address contains an instance of the Ideas contract
			const addr = possibleAddr[1];

			// Skip cached items
			if (checked.has(addr))
				continue;

			web3.eth.getCode(addr)
				.then((code) => {
					// The address is an instance of the Idea contract!
					if (code === Idea.bytecode) {
						setChecked(new Set([...checked, addr]));
					}
				});
		}
	});

	return [...checked];
};
