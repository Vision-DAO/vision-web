import { ProposalVote } from "../../../lib/util/ipfs";
import { useState, ReactElement, useEffect } from "react";
import winStyles from "../idea/prevwindow/IdeaPreviewWindow.module.css";
import styles from "./PropVoteVisualization.module.css";

/**
 * A nested mapping giving frequencies for values occurring in different
 * categories.
 */
type HeightMap = { [val: number]: number }[];

/**
 * Displays a bar chart of the vote distribution for a proposal.
 */
export const PropVoteVisualization = ({ votes }: { votes: ProposalVote[] }) => {
	const [totalVotesByValue, setTotalVotesByValue] = useState<HeightMap>(undefined);
	const [totalVotesPerType, setTotalVotesPerType] = useState<number[]>([0, 0, 0]);
	const [prevVoteCount, setPrevVoteCount] = useState<number>(undefined);
	
	useEffect(() => {
		if (!votes)
			return;

		if (prevVoteCount === undefined) {
			setPrevVoteCount(votes.length);

			return;
		}

		if (totalVotesByValue === undefined || votes.length !== prevVoteCount) {
			setPrevVoteCount(votes.length);
			setTotalVotesByValue(() => {
				return votes.reduce((prev, vote: ProposalVote) => {
					const values = [vote.contents.value ?? 0, vote.contents.interval, vote.contents.expiry.getTime()];
					const newMap: HeightMap = values.map((v, i) => { return { ...prev[i], [v]: (prev[i][v] ?? 0) + vote.weight }; });

					return newMap;
				}, [{}, {}, {}]);
			});
		}
	});

	return (
		<div className={ winStyles.prevWindow }>
			<h2 className={ winStyles.prevWindowHeader }>
				Vote Summary
			</h2>
			<div className={ styles.voteGraph }>
				{  }
			</div>
		</div>
	);
};
