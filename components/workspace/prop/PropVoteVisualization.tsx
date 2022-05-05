import { ProposalVote } from "../../../lib/util/ipfs";
import { useState, ReactElement } from "react";

/**
 * Displays a bar chart of the vote distribution for a proposal.
 */
export const PropVoteVisualization = ({ votes }: { votes: ProposalVote[] }) => {
	const [voteBars, setVoteBars] = useState<{ [value: number]: ReactElement }>(null);

	return (
		<h1>
		</h1>
	);
};
