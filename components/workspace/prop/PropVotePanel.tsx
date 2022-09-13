import styles from "./PropVotePanel.module.css";
import { PropInfo } from "../../../lib/util/proposals/module";
import Web3 from "web3";
import { useEthAddr, formatDate, accounts } from "../../../lib/util/networks";
import BN from "bn.js";
import { useUserBalance, useSymbol } from "../../../lib/util/ipfs";
import { useStream } from "../../../lib/util/graph";
import { GetUserVoteQuery } from "../../../.graphclient";
import type { Scalars } from "../../../.graphclient";
import { useState, useEffect } from "react";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import Prop from "../../../value-tree/build/contracts/Prop.json";
import { Contract } from "web3-eth-contract";
import LinearProgress from "@mui/material/LinearProgress";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { StyledSlider } from "../../input/Slider";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import { FilledButton } from "../../status/FilledButton";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";

/**
 * A panel that allows a user to place a new vote for a proposal,
 * showing a success indicator upon voting.
 */
export const PropVotePanel = ({
	prop,
	web3,
	eth,
}: {
	prop: PropInfo;
	web3: Web3;
	eth: any;
}) => {
	// The currently logged-in Ethereum user
	const loggedIn = useEthAddr();

	const parseBig = (web3: Web3, n: number): BN =>
		web3.utils
			.toBN(Math.trunc(n))
			.mul(web3.utils.toBN(10 ** 18))
			.add(web3.utils.toBN(Math.trunc((n % 1) * 10 ** 18)));

	// The magnitude of the user's preference. This comes from a form entry
	const [nVotes, setNvotes] = useState<number>(0);

	// The user's balance of the voting token (the maximum amount they can vote)
	const existingVotes = useStream<GetUserVoteQuery>(
		{ vote: { votes: 0 as unknown as Scalars["BigInt"] } },
		(graph) => graph.GetUserVote({ vID: `vote${loggedIn}:${prop.id}` }),
		[loggedIn, prop.id]
	);
	const maxVotes =
		useUserBalance(loggedIn, prop.funder.id) +
		Number(existingVotes.vote?.votes ?? 0);
	const voteTicker = useSymbol(prop.funder.id);

	// To save space, this item can be shrunk to just its header
	const [containerExpanded, setContainerExpanded] = useState<boolean>(true);

	// Buffer storing any feedback for the user
	const [errorMsg, setErrorMsg] = useState<string>("");

	// Renders an indicator for when the vote is being sent
	const [voteCasting, setVoteCasting] = useState<boolean>(false);

	// Shows the user a dialog indicating that their vote was successful
	const [confirmationRequired, setConfirmationRequired] =
		useState<boolean>(false);

	// Labels for the vote weight slider
	const max = maxVotes ? maxVotes / 10 ** 18 : 0;
	const marks = [
		{
			value: 0,
			label: `0 ${voteTicker ?? ""}`,
		},
		{
			value: maxVotes / 10 ** 18 ?? 0,
			label: max !== 0 ? `${max.toLocaleString()} ${voteTicker ?? ""}` : "",
		},
	];

	const handleVoteChange = (_: unknown, n: number) => setNvotes(n as number);

	// Casts the user's vote after doing verification on the expected values of the form.
	const castVote = async (direction: number) => {
		// Use the first available ethereum account for all transactions
		const acc = (await accounts(eth))[0];

		const parentContract = new web3.eth.Contract(Idea.abi, prop.funder.id);

		// Allocate the votes to the contract
		await parentContract.methods
			.approve(prop.id, parseBig(web3, Number(nVotes)).toString())
			.send({
				from: acc,
			})
			.on("error", (e) => {
				setErrorMsg(e.message);
			})
			.once("transactionHash", (hash: string) => {
				setErrorMsg(`(1/2) Allocating votes. Tx hash: ${hash}`);

				setVoteCasting(true);
			})
			.then(() => {
				const propContract = new web3.eth.Contract(Prop.abi, prop.id);

				// The votes can now be used
				// Place the vote
				return propContract.methods
					.vote(parseBig(web3, Number(nVotes)).toString(), direction)
					.send({
						from: acc,
					})
					.on("error", (e: { message: string }) => {
						setErrorMsg(e.message);
					})
					.once("transactionHash", (hash: string) => {
						setErrorMsg(`Sending! Tx hash: ${hash}`);

						setVoteCasting(true);
					})
					.once("receipt", () => {
						// Clear any loading indicator
						setErrorMsg("");
						setVoteCasting(false);

						// Show the user an indicator that their vote has been cast
						setConfirmationRequired(true);
					});
			});
	};

	return (
		<div className={styles.votePanelContainer}>
			<div
				className={`${styles.confirmationDialogContainer} ${
					confirmationRequired ? styles.visible : ""
				}`}
			>
				<CheckCircleRounded fontSize="inherit" />
				<h2>Vote Cast</h2>
				<p>
					Your vote has been cast successfully, and will be reflected shortly.
				</p>
				<FilledButton
					className={styles.submitButton}
					label="Ok"
					onClick={() => setConfirmationRequired(false)}
				/>
			</div>
			{new Date() < new Date(Number(prop.expiration) * 1000) ? (
				<div
					className={
						confirmationRequired ? styles.invisibleBody : styles.visibleBody
					}
				>
					<div className={styles.panelHeader}>
						{containerExpanded ? (
							<ExpandMore onClick={() => setContainerExpanded(false)} />
						) : (
							<ExpandLess onClick={() => setContainerExpanded(true)} />
						)}
						<h2>Cast Vote</h2>
					</div>
					<div
						className={`${styles.contentContainer} ${
							containerExpanded ? styles.expanded : ""
						}`}
					>
						<div className={styles.votePanelItem}>
							<div className={styles.combinedInput}>
								Vote Count:{" "}
								<UnderlinedInput
									value={nVotes.toString()}
									placeholder={`0 ${voteTicker}`}
									startingValue={nVotes.toString()}
									onChange={(n) => handleVoteChange(undefined, parseFloat(n))}
									onAttemptChange={(v) =>
										v === ""
											? "0"
											: isNaN(parseFloat(v))
											? nVotes.toString()
											: v
									}
								/>
							</div>
							<div className={styles.votePanelSlider}>
								<StyledSlider
									className={styles.sliderThumb}
									value={nVotes}
									size="small"
									min={0}
									max={maxVotes ? maxVotes / 10 ** 18 : 0}
									defaultValue={0}
									marks={marks}
									onChange={handleVoteChange}
									valueLabelDisplay="auto"
								/>
							</div>
						</div>
						<p>{errorMsg}</p>
						{voteCasting ? (
							<LinearProgress />
						) : (
							<div className={styles.voteChoices}>
								<FilledButton
									label="Vote No"
									onClick={() => castVote(1)}
									className={`${styles.submitButton} ${styles.no}`}
								/>{" "}
								<FilledButton
									label="Vote Yes"
									onClick={() => castVote(0)}
									className={`${styles.submitButton} ${styles.yes}`}
								/>
							</div>
						)}
					</div>
				</div>
			) : (
				<div>
					<h2>Voting Closed</h2>
					<p>
						Proposal expired <b>{formatDate(Number(prop.expiration))}</b> at{" "}
						<b>{formatTime12Hr(new Date(Number(prop.expiration) * 1000))}</b>.
					</p>
				</div>
			)}
		</div>
	);
};
