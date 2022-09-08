import styles from "./PropVotePanel.module.css";
import { PropInfo } from "../../../lib/util/proposals/module";
import Web3 from "web3";
import { useEthAddr, formatDate } from "../../../lib/util/networks";
import { useUserBalance, useSymbol } from "../../../lib/util/ipfs";
import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import Prop from "../../../value-tree/build/contracts/Prop.json";
import { Contract } from "web3-eth-contract";
import Slider, { SliderProps } from "@mui/material/Slider";
import LinearProgress from "@mui/material/LinearProgress";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { StyledSlider } from "../../input/Slider";
import { formatInterval } from "./PropInfoPanel";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import { FilledButton } from "../../status/FilledButton";
import { OutlinedOptionSelector } from "../../input/OutlinedOptionSelector";
import {
	MobileDatePicker,
	MobileDatePickerProps,
} from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";

const StyledDatePicker = styled(MobileDatePicker)<MobileDatePickerProps>(
	() => ({
		"& .MuiButton-root": {
			backgroundColor: "black",
		},
	})
);

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

	// The user's preference
	const [direction, setDirection] = useState<boolean>(true);

	// The magnitude of the user's preference. This comes from a form entry
	const [nVotes, setNvotes] = useState<number>(0);

	// The user's balance of the voting token (the maximum amount they can vote)
	const maxVotes = useUserBalance(loggedIn, prop.funder.id);
	console.log(maxVotes);
	const voteTicker = useSymbol(prop.funder.id);

	// The ticker and decimals of the funding token are used for:
	// - Label human readability
	// - Determining a maximum token amount in slider inputs
	const fundingTokenTicker = useSymbol(prop.rate.token);

	// To save space, this item can be shrunk to just its header
	const [containerExpanded, setContainerExpanded] = useState<boolean>(true);

	// Buffer storing any feedback for the user
	const [errorMsg, setErrorMsg] = useState<string>("");

	// Persisted instance of the contract to which votes can be submitted
	const [propContract, setPropContract] = useState<Contract>(undefined);
	const [parentContract, setParentContract] = useState<Contract>(undefined);

	// Renders an indicator for when the vote is being sent
	const [voteCasting, setVoteCasting] = useState<boolean>(false);

	// Shows the user a dialog indicating that their vote was successful
	const [confirmationRequired, setConfirmationRequired] =
		useState<boolean>(false);

	useEffect(() => {
		if (propContract === undefined) {
			setPropContract(new web3.eth.Contract(Prop.abi, prop.id));
			setParentContract(new web3.eth.Contract(Idea.abi, prop.funder.id));
		}
	}, []);

	// Labels for the vote weight slider
	const marks = [
		{
			value: 0,
			label: `0 ${voteTicker ?? ""}`,
		},
		{
			value: maxVotes / 10 ** 18 ?? 0,
			label: `${maxVotes ? (maxVotes / 10 ** 18).toLocaleString() : "0"} ${
				voteTicker ?? ""
			}`,
		},
	];

	const scale = (n: number): number => 2 ** (256 ** n) - 2;
	const idx = (n: number): number =>
		Math.log(Math.log(n + 2) / Math.log(2)) / (8 * Math.log(2));

	const handleVoteChange = (e: unknown, n: number) => setNvotes(n as number);

	// Casts the user's vote after doing verification on the expected values of the form.
	const castVote = async () => {
		// Serialize structured JS data to an intermediary ABI format
		const rawRate: RawEthPropRate = {
			token: prop.rate.token,
			value: parseBig(
				web3,
				Number(rate.value),
				fundingTokenDecimals
			).toString(),
			intervalLength: (rate.interval * intervalMultiplier).toString(),

			// Convert Date to a unix timestamp
			expiry: Math.floor(rate.expiry.getTime() / 1000).toString(),
			lastClaimed: Math.floor(
				prop.rate.lastClaimed.getTime() / 1000
			).toString(),
			kind: (prop.rate.kind as number).toString(),
		};

		// Use the first available ethereum account for all transactions
		const acc = (await accounts(eth))[0];

		// Allocate the votes to the contract
		await parentContract.methods
			.approve(prop.addr, parseBig(web3, Number(nVotes), 18).toString())
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
				// The votes can now be used
				// Place the vote
				return propContract.methods
					.vote(parseBig(web3, Number(nVotes), 18).toString(), {
						...rawRate,
						value: rawRate.value,
					})
					.send({
						from: acc,
					})
					.on("error", (e) => {
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
							<p>
								Vote Count:{" "}
								<b>
									{nVotes ? nVotes.toLocaleString() : "0"} {voteTicker ?? ""}
								</b>
							</p>
							<div className={styles.votePanelSlider}>
								<StyledSlider
									className={styles.sliderThumb}
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
						{voteCasting && <LinearProgress />}
						<FilledButton
							label="Cast Vote"
							onClick={castVote}
							className={styles.submitButton}
						/>
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
