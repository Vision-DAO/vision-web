import styles from "../IdeaDetailCard.module.css";
import { OutlinedButton } from "../../status/OutlinedButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Skeleton } from "@mui/material";
import { useViewerRecord } from "@self.id/framework";
import { useState } from "react";
import { unwatchIdea, watchIdea } from "../../../lib/util/discovery";
import {
	formatErc,
	formatDate,
	useConnStatus,
	explorers,
	useVisAddr,
} from "../../../lib/util/networks";
import { ModelTypes } from "../../../lib/util/discovery";
import { useIdeaDescription } from "../../../lib/util/ipfs";
import { DAOStatsRepr } from "../../../lib/util/graph";

const InfoItem = ({
	left,
	right,
	key = left,
}: {
	left: string;
	right: JSX.Element;
	key?: string;
}) => {
	return (
		<div className={styles.infoLine} key={key}>
			<p>{left}</p>
			{right}
		</div>
	);
};

const Metric = ({
	val,
	label,
	isPercent = false,
}: {
	val: number;
	label: string;
	isPercent?: boolean;
}) => {
	// Metrics are displayed as relative changes, and must have a
	// corresponding prefix to indicate positive or negative change
	let prefix = "";

	// Absolute values should not have a % suffix
	const suffix = isPercent ? "%" : "";
	let directionStyles = "";

	if (val > 0) {
		prefix = "+";

		directionStyles = ` ${styles.posValueMetric}`;
	} else if (val < 0) {
		prefix = "-";

		directionStyles = ` ${styles.negValueMetric}`;
	}

	return (
		<div className={styles.metric} key={label}>
			<p
				className={`${styles.metricValue}${directionStyles}`}
			>{`${prefix}${val}${suffix}`}</p>
			<p>{label}</p>
		</div>
	);
};

const WatchIdeaButton = ({ ideaAddr }: { ideaAddr: string }) => {
	const watchingRecord = useViewerRecord<
		ModelTypes,
		"visionWatchedItemAddressesList"
	>("visionWatchedItemAddressesList");
	const watched = watchingRecord?.content?.items.includes(ideaAddr) ?? false;

	const watchIdeaCallback = () => {
		if (watched) {
			unwatchIdea(ideaAddr, watchingRecord);
			return;
		}

		watchIdea(ideaAddr, watchingRecord);
	};

	return (
		<OutlinedButton callback={watchIdeaCallback}>
			{watched ? <VisibilityIcon /> : <VisibilityOffIcon />}
			&nbsp;&nbsp;
			{watched ? "Unwatch" : "Watch"}
		</OutlinedButton>
	);
};

/**
 * The section of an Idea Card displaying actual information about the idea.
 * Excludes navigation items, including enter and buy buttons.
 */
export const IdeaInfoPanel = ({ idea }: { idea: DAOStatsRepr }) => {
	const [{ network }] = useConnStatus();
	const visToken = useVisAddr();
	const description = useIdeaDescription(idea.ipfsAddr);

	// Items displayed under the info header, as shown on the figma. See TODO
	const info = {
		Members: <p>{idea.users.length.toLocaleString()}</p>,
		"Date created": <p>{formatDate(idea.createdAt)}</p>,
		"Projects funding": <p>{idea.children.length}</p>,
		Treasury: (
			<p>
				{formatErc(
					idea.treasury.find((elem) => elem.token.id === visToken)?.balance ?? 0
				)}{" "}
				<b>VIS</b>
			</p>
		),
		"Total supply": <p>{formatErc(idea.supply)}</p>,
		Contract: (
			<p>
				<a
					href={`${explorers[network]}/address/${idea.id}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					{idea.id}
				</a>
			</p>
		),
	};

	// Checks that the UNIX timestamp was from the last 24 hours
	const isLast24 = (timestamp: number): boolean => {
		const today = new Date();
		const other = new Date(timestamp * 1000);

		return (
			today.getDay() === other.getDay() &&
			today.getMonth() === other.getMonth() &&
			today.getFullYear() === other.getFullYear()
		);
	};

	// Items also have less detailed metrics for the last 24 hours.
	// See above prop definition
	const metricsDay = {
		Proposals: idea.activeProps.filter((prop) => isLast24(prop.createdAt))
			.length,
		"Finalized Proposals": idea.acceptedProps.filter(
			(prop) => prop.finalizedAt !== undefined && isLast24(prop.finalizedAt)
		).length,
	};

	return (
		<div className={styles.cardInfo}>
			<div className={styles.cardTitleInfo}>
				<div className={styles.cardHeader}>
					<h2>
						{idea.name} ({idea.ticker})
					</h2>
					<WatchIdeaButton ideaAddr={idea.id} />
				</div>
				{description ? (
					<p className={styles.description}>{description}</p>
				) : (
					<div className={styles.description}>
						<Skeleton variant="text" width="100%" />
						<Skeleton variant="text" width="100%" />
						<Skeleton variant="text" width="80%" />
					</div>
				)}
			</div>
			<div>
				<h2>Info</h2>
				{Object.entries(info).map(([key, value]) =>
					InfoItem({ left: key, right: value })
				)}
			</div>
			<div>
				<h2>Last 24h.</h2>
				<div className={styles.cardMetrics}>
					{Object.entries(metricsDay).map(([key, value]) => (
						<Metric
							key={key}
							val={value}
							label={key}
							isPercent={key == "Last Price"}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
