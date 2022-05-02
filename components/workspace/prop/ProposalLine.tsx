import { OutlinedListEntry } from "../../status/OutlinedListEntry";
import { ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { OutlinedListEntryProps } from "../../status/OutlinedListEntry";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import styles from "./ProposalLine.module.css";
import { useConnStatus, explorers } from "../../../lib/util/networks";

const formatDate = (d: Date): string => `${d.getMonth() + 1}/${d.getDay() + 1}/${d.getFullYear()}`;

/**
 * Renders the following information about a proposal on a line, with a callback
 * when the user clicks an "expand" button.
 */
export const ProposalLine = ({ addr, prop, props, onExpand }: { addr: string, prop: ExtendedProposalInformation, props?: OutlinedListEntryProps, onExpand?: () => void }) => {
	const [conn, ] = useConnStatus();

	let title = addr;

	// Find the title of the proposal, and use that, alternatively
	for (const d of Object.values(prop.data)) {
		if (d.kind === "utf-8")
			title = (new TextDecoder()).decode(d.data);
	}

	const expired = new Date() > prop.expiry;

	return (
		<OutlinedListEntry styles={ props }>
			<div className={ styles.rowLabelItem }>
				<ArrowForwardRoundedIcon />
				<a href={ `${explorers[conn.network]}/address/${prop.destAddr}` } target="_blank" rel="noopener noreferrer">{ prop.destAddr.substring(0, 12) }...</a>
			</div>
			<a href={ `${explorers[conn.network]}/address/${addr}` } target="_blank" rel="noopener noreferrer"><b>{ title.substring(0, 24) }{ title.length > 24 ? "..." : "" }</b></a>
			<div className={ styles.rowLabelItem }>
				<p><b>Votes:</b></p>
				<p>{ prop.nVoters }</p>
			</div>
			<div className={ styles.rowLabelItem }>
				<p className={ expired ? styles.labelDone : "" }><b>{ expired ? "Done:" : "Ongoing:" }</b></p>
				<p>{ expired ? "Expired" : "Expires" } { formatDate(prop.expiry) }</p>
			</div>
			<div className={ styles.expandButton } onClick={ onExpand }>
				<FullscreenRoundedIcon fontSize="large" className={ styles.expandIcon } />
			</div>
		</OutlinedListEntry>
	);
};
