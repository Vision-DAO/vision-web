import { formatErc } from "../../../lib/util/networks";
import Tooltip from "@mui/material/Tooltip";
import winStyles from "../idea/prevwindow/IdeaPreviewWindow.module.css";
import styles from "./PropVoteVisualization.module.css";

const formatters = {
	Yes: (v: number) => formatErc(v),
	No: (v: number) => formatErc(v),
};

/**
 * Renders a bar chart of the given y values over the x range.
 */
export const PropertyVisualization = ({
	max,
	bars,
	key,
	label,
	className = "",
}: {
	max: number;
	bars: { [label: string]: number };
	key?: string;
	label: string;
	className?: string;
}) => {
	return (
		<div className={styles.titledBarChart}>
			<div className={styles.barChart}>
				{Object.entries(bars).map(([label, v]) => (
					<Tooltip
						key={label}
						title={formatters[label](Number(v))}
						placement="top"
						arrow
					>
						<div
							className={className}
							key={key}
							style={{ height: `${(v / max) * 100}%` }}
						></div>
					</Tooltip>
				))}
			</div>
			<p>{label}</p>
		</div>
	);
};

/**
 * Displays a bar chart of the vote distribution for a proposal.
 */
export const PropVoteVisualization = ({
	yesVotes,
	noVotes,
	possibleVotes: max,
}: {
	yesVotes: number;
	noVotes: number;
	possibleVotes: number;
}) => {
	return (
		<div className={winStyles.prevWindow}>
			<h2 className={winStyles.prevWindowHeader}>Vote Summary</h2>
			<div className={styles.voteGraphContainer}>
				<div className={styles.voteGraph}>
					<div className={styles.graphYText}>
						<p className={styles.yAxisTitle}># of Votes</p>
						<div className={styles.graphYLabels}>
							<p>{(max / 10 ** 18).toLocaleString() || 0}</p>
							<p>0</p>
						</div>
					</div>
					{[{ Yes: Number(yesVotes) }, { No: Number(noVotes) }].map(
						(points, i) =>
							PropertyVisualization({
								max,
								bars: points,
								label: `${Object.keys(points)[0]} Votes`,
								key: i.toString(),
							})
					)}
				</div>
			</div>
		</div>
	);
};
