import { ProposalVote } from "../../../lib/util/ipfs";
import { useState, ReactElement, useEffect } from "react";
import winStyles from "../idea/prevwindow/IdeaPreviewWindow.module.css";
import { formatBig } from "./PropVotePanel";
import { formatInterval } from "./PropInfoPanel";
import { formatDate } from "../prop/ProposalLine";
import Tooltip from "@mui/material/Tooltip";
import styles from "./PropVoteVisualization.module.css";

/**
 * A nested mapping giving frequencies for values occurring in different
 * categories.
 */
type HeightMap = { [val: number]: number }[];

const formatters = (decimals: number) => { return{
	"Value": (v: number) => formatBig(v / (10 ** decimals), 2),
	"Interval": (interval: number) => formatInterval(interval),
	"Expiry": (expiry: number) => formatDate(new Date(expiry * 1000)),
}; };

/**
 * Renders a bar chart of the given y values over the x range.
 */
export const PropertyVisualization = ({ max, bars, key, decimals, label = "", className = "" }: { decimals: number, max: number, bars: { [x: number]: number }, key?: string, label?: string, className?: string }) => {
	return (
		<div className={ styles.titledBarChart }>
			<div className={ styles.barChart }>
				{ Object.entries(bars).sort(([k1, ], [k2, ]) => k1.localeCompare(k2)).map(([k, v]) =>
					<Tooltip key={ k } title={ formatters(decimals)[label](Number(k)) } placement="top" arrow>
						<div className={ className } key={ key } style={{ height: `${v / max * 100}%` }}>
						</div>
					</Tooltip>
				)}
			</div>
			<p>{ label }</p>
		</div>
	);
};

/**
 * Displays a bar chart of the vote distribution for a proposal.
 */
export const PropVoteVisualization = ({ votes, decimals }: { votes: ProposalVote[], decimals: number }) => {
	const [totalVotesByValue, setTotalVotesByValue] = useState<HeightMap>(undefined);
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

	// Human readable guides
	const labels = ["Value", "Interval", "Expiry"];

	// Find the biggest number of votes
	const max = totalVotesByValue ? Math.max.apply(null, [...totalVotesByValue.map((heightMap) => Object.values(heightMap))]) : 0;

	return (
		<div className={ winStyles.prevWindow }>
			<h2 className={ winStyles.prevWindowHeader }>
				Vote Summary
			</h2>
			<div className={ styles.voteGraphContainer }>
				<div className={ styles.voteGraph }>
					<div className={ styles.graphYText }>
						<p className={ styles.yAxisTitle }># of Votes</p>
						<div className={ styles.graphYLabels }>
							<p>{ (max / (10 ** 18)).toLocaleString() || 0 }</p>
							<p>0</p>
						</div>
					</div>
					{ totalVotesByValue && totalVotesByValue.map((points, i) => PropertyVisualization({ decimals, max, bars: points, key: i.toString(), label: labels[i] })) }
				</div>
			</div>
		</div>
	);
};
