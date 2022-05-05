import styles from "./PropVotePanel.module.css";
import Web3 from "web3";
import { RawEthPropRate, FundingRate, ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { accounts } from "../../../lib/util/networks";
import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { formatDate } from "../prop/ProposalLine";
import { AbiItem, Contract } from "web3-utils";
import Slider, { SliderProps } from "@mui/material/Slider";
import LinearProgress from "@mui/material/LinearProgress";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import { FilledButton } from "../../status/FilledButton";
import { OutlinedOptionSelector } from "../../input/OutlinedOptionSelector";
import { MobileDatePicker, MobileDatePickerProps } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import Prop from "../../../value-tree/build/contracts/Prop.json";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";

export const formatBig = (n: number, nDecimals = 0): string => {
	if (n <= 10000000)
		return n.toLocaleString(undefined, { maximumFractionDigits: nDecimals });

	return n.toExponential(0);
};

const erc20Abi: AbiItem[] = [
	{
		"constant": true,
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{ "name": "", "type": "string" }
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{ "name": "", "type": "uint8" }
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
];

const StyledSlider = styled(Slider)<SliderProps>(() => ({
	"& .MuiSlider-thumb": {
		backgroundColor: "#5D5FEF",
	},
	"& .MuiSlider-track": {
		backgroundColor: "rgba(93, 95, 239, 0.75)",
	}
}));

const StyledDatePicker = styled(MobileDatePicker)<MobileDatePickerProps>(() => ({
	"& .MuiButton-root": {
		backgroundColor: "black",
	},
}));

/**
 * A panel that allows a user to place a new vote for a proposal,
 * showing a success indicator upon voting.
 */
export const PropVotePanel = ({ prop, web3, eth }: { prop: ExtendedProposalInformation, web3: Web3, eth: any }) => {
	// The user's preference
	const [rate, setRate] = useState<FundingRate>({ token: prop.rate.token, value: 0, interval: 0, expiry: !(prop.rate.expiry > new Date(0)) ? new Date() : prop.rate.expiry, lastClaimed: prop.rate.lastClaimed, kind: prop.rate.kind });

	// The magnitude of the user's preference. This comes from a form entry
	const [nVotes, setNvotes] = useState<number>(0);

	// The user's balance of the voting token (the maximum amount they can vote)
	const [maxVotes, setMaxVotes] = useState<number>(undefined);
	const [voteTicker, setVoteTicker] = useState<string>(undefined);

	// The ticker and decimals of the funding token are used for:
	// - Label human readability
	// - Determining a maximum token amount in slider inputs
	const [fundingTokenTicker, setFundingTokenTicker] = useState<string>(undefined);
	const [fundingTokenDecimals, setFundingTokenDecimals] = useState<number>(undefined);

	// To save space, this item can be shrunk to just its header
	const [containerExpanded, setContainerExpanded] = useState<boolean>(true);

	// The user may select to release funding every n days. Determine seconds
	// from that
	const [intervalMultiplier, setIntervalMultiplier] = useState<number>(1);

	// Buffer storing any feedback for the user
	const [errorMsg, setErrorMsg] = useState<string>("");

	// Persisted instance of the contract to which votes can be submitted
	const [propContract, setPropContract] = useState<Contract>(undefined);
	const [parentContract, setParentContract] = useState<Contract>(undefined);

	// Renders an indicator for when the vote is being sent
	const [voteCasting, setVoteCasting] = useState<boolean>(false);

	// Shows the user a dialog indicating that their vote was successful
	const [confirmationRequired, setConfirmationRequired] = useState<boolean>(false);

	useEffect(() => {
		if (propContract === undefined) {
			setPropContract(new web3.eth.Contract(Prop.abi, prop.address));
			setParentContract(new web3.eth.Contract(Idea.abi, prop.parentAddr));
		}

		// Load the maximum votes the user can allocate
		if (maxVotes === undefined) {
			setMaxVotes(0);
			setVoteTicker("");
			setFundingTokenTicker("");
			setFundingTokenDecimals(0);

			(async () => {
				// The contract whose token is used for voting
				const contract = new web3.eth.Contract(Idea.abi, prop.parentAddr);
				const fundingTokenContract = new web3.eth.Contract(erc20Abi, prop.rate.token);

				// The voting token is not the same as the funding token, necessarily
				setFundingTokenTicker(await fundingTokenContract.methods.symbol().call());
				setFundingTokenDecimals(await fundingTokenContract.methods.decimals().call());

				// The ticker of the parent ERC-20 indicates what the user is voting with
				setVoteTicker(await contract.methods.symbol().call());

				// The user's balance is the number of tokens they can allocate to vote
				// for this proposal
				const maxAmount = await contract.methods.balanceOf((await accounts(eth))[0]).call();

				if (!maxAmount)
					return;

				try {
					const parsedAmt = parseInt(maxAmount);

					if (!isNaN(parsedAmt))
						setMaxVotes(parsedAmt);
				} catch (e) {
					console.warn(e);
				}
			})();
		}
	});

	// Labels for the vote weight slider
	const marks = [
		{
			value: 0,
			label: `0 ${voteTicker ?? ""}`,
		},
		{
			value: maxVotes ?? 0,
			label: `${maxVotes ? maxVotes.toLocaleString() : "0"} ${voteTicker ?? ""}`,
		},
	];

	const scale = (n: number): number => 2 ** (256 ** n) - 2;
	const idx = (n: number): number => Math.log(Math.log(n + 2) / Math.log(2)) / (8 * Math.log(2));

	const importantFundingLevels = Array(10).fill(10).map((n, i) => scale(i / 9));
	const fundingLevelMarks = importantFundingLevels.map((n) => { return {
		value: idx(n),
		label: `${formatBig(n)}${idx(n) == 0 ? (" " + (fundingTokenTicker ?? "")) : ""}`,
	}; });

	const handleVoteChange = (e: unknown, n: number) => setNvotes(n as number);
	const handleFundingChange = (e: unknown, n: number) => setRate(rate => { return { ...rate, value: scale(n) }; });
	const handleExpiryChange = (d: Date) => setRate(rate => { return { ...rate, expiry: d }; });
	const handleIntervalChange = (rn: string) => {
		try {
			const n = parseInt(rn);

			// The user provided an invalid input
			if (isNaN(n)) {
				setErrorMsg("Invalid interval value.");

				return;
			}

			setRate(rate => { return { ...rate, interval: n }; });
		} catch (e) {
			console.warn(e);
		}
	};
	const handleIntervalMultiplierChange = (opt: string) => {
		const intervalMultipliers = {
			"Days": 86400,
			"Hours": 3600,
			"Minutes": 60,
			"Seconds": 1,
		};

		setIntervalMultiplier(intervalMultipliers[opt]);
	};

	// Casts the user's vote after doing verification on the expected values of the form.
	const castVote = async () => {
		// Serialize structured JS data to an intermediary ABI format
		const rawRate: RawEthPropRate = {
			token: prop.rate.token,
			value: Math.floor(rate.value * (10 ** fundingTokenDecimals)),
			intervalLength: rate.interval * intervalMultiplier,

			// Convert Date to a unix timestamp
			expiry: Math.floor(rate.expiry.getTime() / 1000),
			lastClaimed: Math.floor(prop.rate.lastClaimed.getTime() / 1000),
			kind: prop.rate.kind,
		};

		// Use the first available ethereum account for all transactions
		const acc = (await accounts(eth))[0];

		// Allocate the votes to the contract
		parentContract.methods.approve(prop.address, nVotes).send({
			from: acc,
		})
			.on("error", (e) => {
				setErrorMsg(e.message);
			})
			.on("transactionHash", (hash: string) => {
				setErrorMsg(`(1/2) Allocating votes. Tx hash: ${hash}`);

				setVoteCasting(true);
			})
		// The votes can now be used
			.on("receipt", () => {
				// Place the vote
				propContract.methods.vote(nVotes, { ...rawRate, value: rawRate.value.toString() }).send({
					from: acc,
				})
					.on("error", (e) => {
						setErrorMsg(e.message);
					})
					.on("transactionHash", (hash: string) => {
						setErrorMsg(`Sending! Tx hash: ${hash}`);

						setVoteCasting(true);
					})
					.on("receipt", () => {
						// Clear any loading indicator
						setErrorMsg("");
						setVoteCasting(false);

						// Show the user an indicator that their vote has been cast
						setConfirmationRequired(true);
					});
			});
	};

	return (
		<div className={ styles.votePanelContainer }>
			<div className={ `${styles.confirmationDialogContainer} ${confirmationRequired ? styles.visible : ""}` }>
				<CheckCircleRounded fontSize="inherit" />
				<h2>Vote Cast</h2>
				<p>Your vote has been cast successfully, and will be reflected shortly.</p>
				<FilledButton className={ styles.submitButton } label="Ok" onClick={ () => setConfirmationRequired(false) } />
			</div>
			{ new Date() < prop.expiry ?
				<div className={ confirmationRequired ? styles.invisibleBody : styles.visibleBody }>
					<div className={ styles.panelHeader }>
						{ containerExpanded ? <ExpandMore onClick={ () => setContainerExpanded(false) } /> : <ExpandLess onClick={ () => setContainerExpanded(true) }/> }
						<h2>Cast Vote</h2>
					</div>
					<div className={ `${styles.contentContainer} ${containerExpanded ? styles.expanded : "" }` }>
						<div className={ styles.votePanelItem }>
							<p>Vote Count: <b>{ nVotes ? nVotes.toLocaleString() : "0" } { voteTicker ?? "" }</b></p>
							<div className={ styles.votePanelSlider }>
								<StyledSlider className={ styles.sliderThumb } size="small" min={ 0 } max={ maxVotes ?? 0 } defaultValue={ 0 } marks={ marks } onChange={ handleVoteChange } valueLabelDisplay="auto" />
							</div>
						</div>
						<div className={ styles.votePanelItem }>
							<p>Funding Amount: <b>{ formatBig(rate.value, 3) } { fundingTokenTicker ?? "" }</b></p>
							<div className={ styles.votePanelSlider }>
								<StyledSlider className={ styles.sliderThumb } size="small" step={ 0.001 } min={ 0 } max={ 1 } defaultValue={ 0 } marks={ [...fundingLevelMarks] } onChange={ handleFundingChange } scale={ scale } valueLabelDisplay="off" />
							</div>
						</div>
						<div className={ styles.multiChildItem }>
							<div className={ styles.votePanelItem }>
								<p>Funding Expiration Date: <b>{ formatDate(rate.expiry) }</b></p>
								<LocalizationProvider dateAdapter={ AdapterDateFns }>
									<StyledDatePicker
										value={ rate.expiry }
										onChange={ handleExpiryChange }
										className={ styles.datePicker }
										renderInput={ (params) => <UnderlinedInput onClick={ (e) => params.inputProps.onClick(e) } placeholder={ formatDate(rate.expiry) } /> }
									/>
								</LocalizationProvider>
							</div>
							<div className={ styles.votePanelItem }>
								<p>Funding Interval: <b>{ rate.interval }</b></p>
								<div className={ styles.intervalPicker }>
									<UnderlinedInput placeholder="Every 2" startingValue="" onChange={ handleIntervalChange } />
									<OutlinedOptionSelector options={ ["Days", "Hours", "Minutes", "Seconds"] } onChange={ handleIntervalMultiplierChange } onClear={ () => ({}) } />
								</div>
							</div>
						</div>
						<p>{ errorMsg }</p>
						{ voteCasting && <LinearProgress /> }
						<FilledButton label="Cast Vote" onClick={ castVote } className={ styles.submitButton } />
					</div>
				</div>
				:
				<div>
					<h2>Voting Closed</h2>
					<p>Proposal expired <b>{ formatDate(prop.expiry) }</b> at <b>{ formatTime12Hr(prop.expiry) }</b>.</p>
				</div>
			}
		</div>
	);
};
