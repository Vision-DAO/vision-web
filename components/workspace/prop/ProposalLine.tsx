import { useIdeaImage, useIdeaDescription } from "../../../lib/util/ipfs";
import { Fragment } from "react";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import ClearIcon from "@mui/icons-material/ClearRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";
import styles from "./ProposalLine.module.css";
import { explorers, formatDateObj } from "../../../lib/util/networks";
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

	/**
	 * Gets a human readable time difference between a and b.
	 */
	const getHRDiff = (a: Date, b: Date): [string, string] => {
		const diff = a.getTime() - b.getTime();

		const diffLabels = {
			604800000: "week",
			86400000: "day",
			3600000: "hour",
		};

		for (const [key, label] of Object.entries(diffLabels).sort(
			([keyA], [keyB]) => Number(keyB) - Number(keyA)
		)) {
			const diffLimit = Number(key);

			if (diff < diffLimit) continue;

			const limitDiff = Math.round(diff / diffLimit);

			return [`${limitDiff}`, `${label}${limitDiff !== 1 ? "s" : ""}`];
		}

		const secDiff = Math.round(diff / 1000);
		return [`${secDiff}`, `second${secDiff !== 1 ? "s" : ""}`];
	};

	const statusIcons = {
		Rejected: <ClearIcon />,
		Accepted: <CheckIcon />,
	};

	const [expTime, expLabel] = getHRDiff(
		new Date(prop.expiration * 1000),
		new Date()
	);
	const [ageTime, ageLabel] = getHRDiff(
		new Date(),
		new Date(prop.createdAt * 1000)
	);

	return (
		<div className={styles.propRow}>
			<div className={styles.leftInfo}>
				<img className={styles.propIcon} height="100%" width="25%" src={icon} />
				<div className={styles.propTextInfo}>
					<div className={`${styles.row} ${styles.spaced}`}>
						<h2 className={styles.propTitle}>{prop.title}</h2>
						<div className={styles.row}>
							<ProfileTooltip addr={prop.author.id} />
							<p>•{formatDateObj(new Date(prop.createdAt * 1000))}</p>
						</div>
					</div>
					{description !== undefined ? (
						<p className={styles.propDescription}>{description}</p>
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
			<div className={styles.rightInfo}>
				<div className={styles.propStat}>
					{prop.status === "Pending" ? (
						<Fragment>
							<h1>{Number(prop.votesFor) + Number(prop.votesAgainst)}</h1>
							<p>Votes</p>
						</Fragment>
					) : (
						<Fragment>
							{statusIcons[prop.status]}
							<p>{prop.status}</p>
						</Fragment>
					)}
				</div>
				<div className={styles.propStat}>
					{
						{
							Pending: (
								<Fragment>
									<p>Expires In</p>
									<h1>{expTime}</h1>
									<p>{expLabel}</p>
								</Fragment>
							),
						}[prop.status]
					}
				</div>
				<div className={styles.propStat}>
					{
						{
							Pending: (
								<Fragment>
									<h1>{ageTime}</h1>
									<p>{ageLabel} Old</p>
								</Fragment>
							),
						}[prop.status]
					}
				</div>
			</div>
		</div>
	);
};
