import {
	useIdeaImage,
	useIdeaDescription,
	useActorTitleNature,
	useSymbol,
} from "../../../lib/util/ipfs";
import { Fragment } from "react";
import { PercentageLine } from "./PercentageLine";
import ClearIcon from "@mui/icons-material/ClearRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";
import styles from "./ProposalLine.module.css";
import {
	explorers,
	formatDateObj,
	formatErc,
	useConnStatus,
} from "../../../lib/util/networks";
import { GetPropsQuery, GetDaoAboutQuery } from "../../../.graphclient";
import { ProfileTooltip } from "../../status/ProfileTooltip";
import { Skeleton } from "@mui/material";
import { useRouter } from "next/router";

/**
 * Renders the following information about a proposal on a line, with a callback
 * when the user clicks an "expand" button.
 */
export const ProposalLine = ({
	prop,
	oldProp,
	parent,
	onExpand,
	onFinalize,
}: {
	prop:
		| GetPropsQuery["idea"]["activeProps"][0]
		| GetPropsQuery["idea"]["children"][0];
	oldProp?: GetPropsQuery["idea"]["children"][0];
	parent: GetDaoAboutQuery["idea"];
	onExpand?: () => void;
	onFinalize?: () => void;
}) => {
	// Binary data loaded via IPFS
	const icon = useIdeaImage(prop.ipfsAddr);
	const [conn] = useConnStatus();
	const description = useIdeaDescription(prop.ipfsAddr);
	const router = useRouter();

	// Human-readable party to fund
	const [toFund, fundeeKind] = useActorTitleNature(prop.toFund);
	const fundeeURL = {
		user: () => router.push(`/profile/${prop.toFund}`),
		dao: () => router.push(`/ideas/${prop.toFund}`),
		addr: () =>
			window.open(`${explorers[conn.network]}/address/${prop.toFund}`),
	}[fundeeKind];
	const ticker = useSymbol(prop.rate.token);
	const oldTicker = useSymbol(oldProp?.rate.token);

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
				<img
					className={styles.propIcon}
					height="100%"
					width="12vw"
					src={icon}
				/>
				<div className={styles.propTextInfo}>
					<div className={styles.topTextInfo}>
						<div className={`${styles.row} ${styles.spaced} ${styles.full}`}>
							<h2
								className={`${styles.propTitle} ${styles.actorLink}`}
								onClick={onExpand}
							>
								{prop.title}
							</h2>
							<div className={`${styles.row} ${styles.authorRow}`}>
								<ProfileTooltip addr={prop.author.id} />
								<p className={styles.separator}>•</p>
								<p className={styles.noMargin}>
									{formatDateObj(new Date(prop.createdAt * 1000))}
								</p>
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
					<div className={styles.bottomTextInfo}>
						<PercentageLine percentage={prop.votesFor / parent.supply} />
						<div className={styles.explanationsList}>
							<div className={styles.yesExplanation}>
								<p>Yes:</p>
								<p>
									Change the funding rate for{" "}
									<a className={styles.actorLink} onClick={fundeeURL}>
										{toFund}
									</a>{" "}
									to {formatErc(prop.rate.value)} {ticker}
								</p>
							</div>
							<div className={styles.noExplanation}>
								<p>No:</p>
								<p>
									Keep the funding rate at {oldProp?.rate.value ?? 0}{" "}
									{oldTicker}
								</p>
							</div>
						</div>
					</div>
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
