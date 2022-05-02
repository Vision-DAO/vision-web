import { GossipProposalInformation, ExtendedProposalInformation, IpfsClient, loadExtendedProposalInfo } from "../../../lib/util/ipfs";
import { isIdeaContract } from "../../../lib/util/discovery";
import { staticProposals, useConnStatus } from "../../../lib/util/networks";
import { useState, useEffect } from "react";
import { ProposalLine } from "./ProposalLine";
import { OutlinedListEntry } from "../../status/OutlinedListEntry";
import styles from "./ProposalsList.module.css";
import Web3 from "web3";

/**
 * Renders a list of gossiped proposals.
 */
export const ProposalsList = ({ web3, ipfs, proposals, onSelectProp }: { web3: Web3, ipfs: IpfsClient, proposals: GossipProposalInformation[], onSelectProp?: (addr: string, prop: ExtendedProposalInformation) => void }) => {
	// Essentially Promise.all proposals
	const [loaded, setLoaded] = useState<{ [prop: string]: ExtendedProposalInformation }>({});
	const [blocked, setBlocked] = useState<Set<string>>(new Set());
	const [conn, ] = useConnStatus();

	// Filter out any contracts that aren't instances of the Proposal contract,
	// and that aren't for the currently selected network
	const [targetBytecode, setTargetBytecode] = useState<string>();

	useEffect(() => {
		// The contract's bytecode is currently being loaded
		if (targetBytecode === null)
			return;

		// Load the Proposal contract's bytecode
		if (targetBytecode === undefined) {
			setTargetBytecode(null);

			web3.eth.getCode(staticProposals[conn.network])
				.then((bytecode) => setTargetBytecode(bytecode));
		}

		for (const prop of proposals) {
			if (!targetBytecode)
				break;

			// Skip items that aren't proposal instances, for example
			if (prop.addr in blocked)
				continue;

			// Skip proposals that have already been loaded
			if (prop.addr in loaded)
				continue;

			// The item is already queued for loading
			if (loaded[prop.addr] === null)
				continue;

			// Start loading the item
			(async () => {
				// Block items that aren't proposals
				if (!await isIdeaContract(web3, prop.addr, targetBytecode)) {
					setBlocked(blocked => new Set([...blocked, prop.addr]));
				}

				const info: ExtendedProposalInformation = await loadExtendedProposalInfo(ipfs, conn.network, web3, prop);
				setLoaded(loaded => { return { ...loaded, [prop.addr]: info }; });
			})();
		}
	});

	const items = Object.entries(loaded);

	return (
		<div>
			<OutlinedListEntry styles={{ className: styles.spacedList, roundTop: true, roundBottom: false, altColor: true }}>
				<p><b>To Fund</b></p>
				<p><b>Description</b></p>
				<p><b>Total Votes</b></p>
				<p><b>Status</b></p>
				<p></p>
			</OutlinedListEntry>
			{
				items.length > 0 ?
					items
						.map(([addr, prop], i) =>
							<ProposalLine key={ addr } addr={ addr } prop={ prop } props={{ roundTop: false, roundBottom: i === items.length - 1 }} onExpand={ () => onSelectProp(addr, prop) } />
						) :
					<OutlinedListEntry styles={{ className: styles.spacedList, roundTop: false }}>
						<p>No proposals found.</p>
					</OutlinedListEntry>
			}
		</div>
	);
};
