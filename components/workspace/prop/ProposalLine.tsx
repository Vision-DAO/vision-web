import { useIdeaImage, useIdeaDescription } from "../../../lib/util/ipfs";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import { useState, useEffect } from "react";
import styles from "./ProposalLine.module.css";
import { explorers } from "../../../lib/util/networks";
import { GetPropsQuery } from "../../../.graphclient";
import { ProfileTooltip } from "../../status/ProfileTooltip";
import { Skeleton } from "@mui/material";

/**
 * Renders the following information about a proposal on a line, with a callback
 * when the user clicks an "expand" button.
 */
export const ProposalLine = ({
	prop,
	onExpand,
	onFinalize,
}: {
	prop:
		| GetPropsQuery["idea"]["activeProps"][0]
		| GetPropsQuery["idea"]["children"][0];
	onExpand?: () => void;
	onFinalize?: () => void;
}) => {
	// Binary data loaded via IPFS
	const icon = useIdeaImage(prop.ipfsAddr);
	const description = useIdeaDescription(prop.ipfsAddr);

	return (
		<div className={styles.propRow}>
			<img src={icon} />
			<div className={styles.propTextInfo}>
				<div className={`${styles.row} ${styles.spaced}`}>
					<h2>{prop.title}</h2>
					<div className={`${styles.row}`}>
						<ProfileTooltip addr={prop.author.id} />
					</div>
				</div>
				{description !== undefined ? (
					<p>{description}</p>
				) : (
					<div className={styles.descSkeleton}>
						{" "}
						<Skeleton variant="text" width="100%" />
						<Skeleton width="100%" variant="text" />{" "}
						<Skeleton variant="text" width="80%" />{" "}
					</div>
				)}
			</div>
		</div>
	);
};
