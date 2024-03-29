import {
	useIdeaImage,
	useIdeaDescription,
	useActorTitleNature,
	useSymbol,
	useActionLink,
} from "../../../lib/util/ipfs";
import { Fragment, useState } from "react";
import { PercentageLine } from "./PercentageLine";
import ClearIcon from "@mui/icons-material/ClearRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";
import SavingsIcon from "@mui/icons-material/SavingsRounded";
import styles from "./ProposalLine.module.css";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import {
	useEthAddr,
	formatDateObj,
	formatErc,
	formatBig,
} from "../../../lib/util/networks";
import { useWeb3 } from "../../../lib/util/web3";
import { GetPropsQuery, GetDaoAboutQuery } from "../../../.graphclient";
import { ProfileTooltip } from "../../status/ProfileTooltip";
import { FilledButton } from "../../status/FilledButton";
import { LinearProgress, CircularProgress } from "@mui/material";
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
}: {
	prop:
		| GetPropsQuery["idea"]["activeProps"][0]
		| GetPropsQuery["idea"]["children"][0];
	oldProp?: GetPropsQuery["idea"]["children"][0];
	parent: GetDaoAboutQuery["idea"];
	onExpand?: () => void;
}) => {
	// Binary data loaded via IPFS
	const icon = useIdeaImage(prop.ipfsAddr);
	const description = useIdeaDescription(prop.ipfsAddr);
	const router = useRouter();
	const account = useEthAddr();

	// Errors, or messages that were emitted upon finalizing
	const [errMsg, setErrMsg] = useState<string | null>(null);
	const [depMsg, setDepMsg] = useState<string | null>(null);
	const [pending, setPending] = useState<boolean>(false);

	const [releasePending, setReleasePending] = useState<boolean>(false);

	// Human-readable party to fund
	const [toFund] = useActorTitleNature(prop.toFund);
	const fundeeURL = useActionLink(prop.toFund, router);
	const ticker = useSymbol(prop.rate.token);
	const oldTicker = useSymbol(oldProp?.rate.token);
	const [web3] = useWeb3();

	/**
	 * Gets a human readable time difference between a and b.
	 */
	const getHRDiff = (a: Date, b: Date): [string, string] => {
		const diff = a.getTime() - b.getTime();

		const diffLabels = {
			604800000: "week",
			86400000: "day",
			3600000: "hour",
			60000: "minute",
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

	const [expTime, expLabel] = getHRDiff(
		new Date(prop.expiration * 1000),
		new Date()
	);
	const [ageTime, ageLabel] = getHRDiff(
		new Date(),
		new Date(prop.createdAt * 1000)
	);

	/**
	 * Finalizes the current proposal.
	 */
	const onFinalize = async () => {
		setPending(true);

		const contract = new web3.eth.Contract(Idea.abi, prop.funder.id);
		contract.methods
			.finalizeProp(prop.id)
			.send({ from: account })
			.on("error", (e: string) => {
				setPending(false);

				setErrMsg(typeof e === "string" ? e : e.message);
			})
			.on("transactionHash", (hash: string) => {
				setDepMsg(`Finalizing proposal: ${hash}`);
			})
			.on("receipt", () => {
				setPending(false);
			});
	};

	/**
	 * Releases designated funds from this proposal, if possible.
	 */
	const onReleaseFunds = async () => {
		setReleasePending(true);

		// Make sure the DAO has enough of the funding token to spend if it's a treasury allocation
		const treasuryEntry = prop.funder.treasury.find(
			({ token: { id } }) => id === prop.rate.token
		) ?? { balance: 0, token: { id: prop.rate.token, ticker: ticker } };

		const contract = new web3.eth.Contract(Idea.abi, prop.funder.id);

		const actual = await contract.methods.fundedIdeas(prop.toFund).call();

		if (
			prop.rate.kind === "Treasury" &&
			treasuryEntry.balance < prop.rate.value
		) {
			setErrMsg(
				`${prop.funder.name} doesn't have enough ${ticker} to release funding.`
			);
			setReleasePending(false);

			return;
		}

		contract.methods
			.disperseFunding(prop.toFund)
			.send({ from: account })
			.on("error", (e: string | { message: string }) => {
				setReleasePending(false);

				setErrMsg(typeof e === "string" ? e : e.message);
			})
			.on("transactionHash", (hash: string) => {
				setDepMsg(`Releasing funds: ${hash}`);
			})
			.on("receipt", () => {
				setReleasePending(false);

				setDepMsg("Funds released!");
			});
	};

	const votesLabel = formatErc(
		Number(prop.votesFor) + Number(prop.votesAgainst)
	);

	return (
		<div className={styles.propRow}>
			<div className={styles.leftInfo}>
				{icon && (
					<img
						className={styles.propIcon}
						height="100%"
						width="12vw"
						src={icon}
					/>
				)}
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
									{formatDateObj(new Date(Number(prop.createdAt) * 1000))}
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
						{depMsg ? (
							<p className={styles.status}>{depMsg}</p>
						) : errMsg !== null ? (
							<p className={`${styles.errMsg} ${styles.status}`}>{errMsg}</p>
						) : new Date() > new Date(Number(prop.expiration) * 1000) &&
						  prop.status === "Pending" ? (
							<FilledButton
								className={styles.finalizeButton}
								onClick={onFinalize}
								label="Finalize Proposal"
							/>
						) : (
							<Fragment>
								<PercentageLine
									percentage={Number(prop.votesFor) / Number(parent.supply)}
								/>
								<div className={styles.explanationsList}>
									<div className={styles.yesExplanation}>
										<p>Yes:</p>
										<p>
											Change the funding rate for{" "}
											<a className={styles.actorLink} onClick={fundeeURL}>
												{toFund}
											</a>{" "}
											to {formatErc(Number(prop.rate.value))} {ticker}
										</p>
									</div>
									<div className={styles.noExplanation}>
										<p>No:</p>
										<p>
											Keep the funding rate at{" "}
											{formatErc(Number(oldProp?.rate.value ?? 0))} {oldTicker}
										</p>
									</div>
								</div>
							</Fragment>
						)}
						{pending && <LinearProgress />}
					</div>
				</div>
			</div>
			<div className={styles.rightInfo}>
				<div className={styles.propStat}>
					<h1 style={{ fontSize: votesLabel.length > 3 ? "1.5em" : undefined }}>
						{votesLabel}
					</h1>
					<p>Votes</p>
				</div>
				{expTime.includes("-") ? (
					Number(prop.votesFor) > 0.5 * Number(parent.supply) ||
					prop.status === "Accepted" ? (
						prop.status === "Pending" ? (
							<div className={`${styles.goodStat} ${styles.propStat}`}>
								<p>Proposal</p>
								<CheckIcon fontSize="large" />
								<p>Accepted</p>
							</div>
						) : !prop.rate.spent ? (
							<div
								className={`${styles.goodStat} ${styles.propStat} ${styles.clickableStat}`}
								onClick={onReleaseFunds}
							>
								{!releasePending ? (
									<Fragment>
										<SavingsIcon />
										<p>Release Funding</p>
									</Fragment>
								) : (
									<CircularProgress />
								)}
							</div>
						) : (
							<div className={`${styles.goodStat} ${styles.propStat}`}>
								<p>Funding</p>
								<ClearIcon />
								<p>Spent</p>
							</div>
						)
					) : (
						<div className={`${styles.badStat} ${styles.propStat}`}>
							<p>Proposal</p>
							<ClearIcon />
							<p>Rejected</p>
						</div>
					)
				) : (
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
				)}
				<div className={styles.propStat}>
					<h1>{ageTime}</h1>
					<p>{ageLabel} Old</p>
				</div>
			</div>
		</div>
	);
};
