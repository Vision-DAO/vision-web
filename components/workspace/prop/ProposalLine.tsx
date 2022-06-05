import { OutlinedListEntry } from "../../status/OutlinedListEntry";
import { ExtendedProposalInformation, ExtendedIdeaInformation } from "../../../lib/util/ipfs";
import { OutlinedListEntryProps } from "../../status/OutlinedListEntry";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import { useState, useEffect } from "react";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import styles from "./ProposalLine.module.css";
import { useConnStatus, explorers } from "../../../lib/util/networks";
import Web3 from "web3";

export const formatDate = (d: Date): string => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

/**
 * Renders the following information about a proposal on a line, with a callback
 * when the user clicks an "expand" button.
 */
export const ProposalLine = ({ addr, prop, web3, props, onExpand, onFinalize }: { web3: Web3, addr: string, prop: ExtendedProposalInformation, props?: OutlinedListEntryProps, onExpand?: () => void, onFinalize?: () => void }) => {
	const [conn, ] = useConnStatus();
	const [nVoters, setNVoters] = useState<number>(0);
	const [[totalVotes, possibleVotes], setTotalVotes] = useState<[number, number]>([0, 0]);
	const [expired, setExpired] = useState<boolean>((new Date()) > prop.expiry);

	let title = addr;

	// Find the title of the proposal, and use that, alternatively
	for (const d of Object.values(prop.data)) {
		if (d.kind === "utf-8")
			title = (new TextDecoder()).decode(d.data);
	}

	useEffect(() => {
		const isExpired = (new Date() > prop.expiry);
		if (isExpired !== expired || nVoters !== prop.nVoters) {
			setExpired(isExpired);
			setNVoters(prop.nVoters);

			// Reload the number of votes to accurately display information relevant
			// to the success of the proposal
			(async () => {
				const contract = new web3.eth.Contract(Idea.abi, prop.parentAddr);

				const used = await contract.methods.balanceOf(prop.addr).call();
				const supply = await contract.methods.totalSupply().call();

				// Update the vote count
				setTotalVotes([used, supply]);
			})();
		}
	});

	const successful = (totalVotes && totalVotes > (0.5 * possibleVotes));

	return (
		<OutlinedListEntry styles={ props }>
			<div className={ styles.rowLabelItem }>
				<ArrowForwardRoundedIcon />
				<a href={ `${explorers[conn.network]}/address/${prop.destAddr}` } target="_blank" rel="noopener noreferrer">{ prop.destAddr.substring(0, 12) }...</a>
			</div>
			<a href={ `${explorers[conn.network]}/address/${addr}` } target="_blank" rel="noopener noreferrer"><b>{ title.substring(0, 24) }{ title.length > 24 ? "..." : "" }</b></a>
			<div className={ styles.rowLabelItem }>
				<p><b>Votes:</b></p>
				<p>{ (totalVotes / (10 ** 18)).toLocaleString() }</p>
			</div>
			<div className={ styles.rowLabelItem }>
				<p className={ expired ? (successful ? styles.labelDone : styles.labelFail) : "" }><b>{ expired ? "Done:" : "Ongoing:" }</b></p>
				<p>{ expired ? "Expired" : "Expires" } { formatDate(prop.expiry) } { formatTime12Hr(prop.expiry) }</p>
			</div>
			{ expired ?
				<div className={ styles.rowLabelItem }>
					<p className={ `${styles.labelButton} ${successful ? styles.labelDone : styles.labelFail}` } onClick={ onFinalize }><b>Finalize Proposal</b></p>
				</div>
				: <></>
			}
			<div className={ styles.expandButton } onClick={ onExpand }>
				<FullscreenRoundedIcon fontSize="large" className={ styles.expandIcon } />
			</div>
		</OutlinedListEntry>
	);
};
