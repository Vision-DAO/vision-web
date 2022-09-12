import { IpfsClient, IdeaData, useSymbol } from "../../../lib/util/ipfs";
import { accounts, formatDate } from "../../../lib/util/networks";
import { MultiTypeInput } from "../../input/MultiTypeInput";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { formatTime12Hr } from "../../workspace/idea/activity/ActivityEntry";
import { MultiPageInput } from "../../input/MultiPageInput";
import { GuidedAddrInput, GuideKind } from "../../input/GuidedAddrInput";
import { useState } from "react";
import { serialize } from "bson";
import { Dropdown } from "../../input/Dropdown";
import BigNumber from "bignumber.js";
import {
	MobileDatePicker,
	MobileDateTimePicker,
	LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { OutlinedOptionSelector } from "../../input/OutlinedOptionSelector";
import styles from "./NewProposalPanel.module.css";
import Proposal from "../../../value-tree/build/contracts/Prop.json";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import LinearProgress from "@mui/material/LinearProgress";
import CalendarIcon from "@mui/icons-material/CalendarTodayRounded";
import Web3 from "web3";
import { GetDaoAboutQuery } from "../../../.graphclient";

// Fields that must not be null on submission
const requiredFields = {
	title: { label: "title", page: 0 },
	parentAddr: { label: "parentAddr", page: 0 },
	destAddr: { label: "address to fund", page: 1 },
	expiry: { label: "voting expiration date", page: 3 },
	dataIpfsAddr: { label: "metadata attachment", page: 0 },
	data: { label: "data", page: 0 },
};

const requiredRateFields = {
	token: { label: "funding token", page: 2 },
	value: { label: "amount of funds", page: 2 },
	kind: { label: "pay by", page: 2 },
	interval: { label: "funding interval", page: 1 },
	expiry: { label: "funding expiration", page: 1 },
};

/**
 * Inputs for expiry times are scaled to a unit of time.
 */
const timeMultipliers = {
	Days: 86400,
	Hours: 3600,
	Minutes: 60,
	Seconds: 1,
};

/**
 * A section of the proposals page that allows a user to deploy new proposals.
 */
export const NewProposalPanel = ({
	web3,
	eth,
	ipfs,
	parentAddr,
	parent,
	onDeploy,
}: {
	web3: Web3;
	eth: any;
	ipfs: IpfsClient;
	parentAddr: string;
	parent: GetDaoAboutQuery["idea"];
	onDeploy: () => void;
}) => {
	const [setInputPage, setSetInputPage] = useState(null);
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [deploying, setDeploying] = useState<boolean>(false);

	// The number of seconds to multiply the input by (e.g., days, hours, minutes)
	const [timeMultiplier, setTimeMultiplier] = useState<number>(86400);
	const [expiry, setParsedExpiry] = useState<number>(
		new Date().getTime() / 1000
	);
	const [fundingExpiry, setFundingExpiry] = useState<number>(
		new Date().getTime() / 1000
	);
	const fundingKinds = ["Treasury Allocation", `Making More ${parent.ticker}`];

	// Default form values. ALL are required
	const [propDetails, setPropDetails] = useState<AllProposalInformation>({
		parentAddr,
		destAddr: "",
		address: "",
		rate: {
			token: "",
			value: 0,
			kind: null,
			interval: null,
			expiry: null,
			lastClaimed: null,
		},
		expiry: null,
		nVoters: 0,
		dataIpfsAddr: "",
		title: "",
		data: [],
		addr: "",
	});

	// Ticker of the token used for payment
	const paymentTicker = useSymbol(propDetails.rate.token);

	const mutatePropField =
		<T,>(field: string) =>
		(val: T) =>
			setPropDetails((details) => {
				return { ...details, [field]: val };
			});

	const mutateRateField =
		<T,>(field: string) =>
		(val: T) =>
			setPropDetails((details) => {
				return { ...details, rate: { ...details.rate, [field]: val } };
			});

	// Handles uploading the metadata from the new proposal form to IPFS.
	const metadataUploader = async (data: IdeaData[]) => {
		// Upload the data to IPFS, and set the new form value
		const cid = (
			await ipfs.add(new Uint8Array(serialize(data)))
		).cid.toString();
		setPropDetails((details) => {
			return { ...details, data: data, dataIpfsAddr: cid };
		});
	};

	/**
	 * Attempts to deploy the contract, displaying an error message otherwise.
	 */
	const deployContract = async () => {
		for (const [key, { label, page }] of Object.entries(requiredFields)) {
			if (key === "expiry") {
				if (expiry === 0) {
					setStatusMessage(() => "Invalid expiry date.");
					setInputPage(page);

					return;
				}

				continue;
			}

			if (propDetails[key] === null || propDetails[key] === undefined) {
				setStatusMessage(() => `Missing required proposal field: ${label}.`);
				setInputPage(page);

				return;
			}
		}

		for (const [key, { label, page }] of Object.entries(requiredRateFields)) {
			if (key === "expiry") {
				if (fundingExpiry === 0) {
					setStatusMessage(() => "Invalid funding expiry date.");
					setInputPage(page);

					return;
				}

				continue;
			}

			if (
				propDetails.rate[key] === null ||
				propDetails.rate[key] === undefined
			) {
				setStatusMessage(() => `Missing required proposal field: ${label}.`);
				setInputPage(page);

				return;
			}
		}

		const contract = new web3.eth.Contract(Proposal.abi);
		const registry = new web3.eth.Contract(Idea.abi, parent.id);
		const deployer = (await accounts(eth))[0];

		try {
			setDeploying(true);

			await contract
				.deploy({
					data: Proposal.bytecode,
					arguments: [
						propDetails.title,
						propDetails.parentAddr,
						propDetails.destAddr,
						propDetails.rate.token,
						propDetails.rate.kind,
						new BigNumber(propDetails.rate.value).times(
							new BigNumber(10).pow(18)
						),
						propDetails.rate.interval,
						fundingExpiry,
						propDetails.dataIpfsAddr,
						expiry,
					],
				})
				.send({
					from: deployer,
				})
				.on("error", (e) => {
					setStatusMessage(e.message);
					console.error(e);

					setDeploying(false);
				})
				.on("transactionHash", (hash) => {
					setStatusMessage(`Deploying! Tx hash: ${hash}`);

					setDeploying(true);
				})
				.on("receipt", (receipt) => {
					if (!receipt.contractAddress) {
						setStatusMessage("Failed to deploy contract.");
					}

					setDeploying(true);

					return registry.methods
						.submitProp(receipt.contractAddress)
						.send({ from: deployer })
						.on("error", (e) => {
							setStatusMessage(e.message);
							console.error(e);

							setDeploying(false);
						})
						.on("transactionHash", (hash) => {
							setStatusMessage(`Registering proposal! Tx hash: ${hash}`);
						})
						.on("receipt", () => {
							setDeploying(false);

							onDeploy();
						});
				});
		} catch (e) {
			setStatusMessage(`Failed to deploy contract: ${e}`);

			console.error(e);
		}
	};

	const inputs =
		statusMessage === "" ? (
			[
				<p key="desc-1">
					Make your proposal stand out by describing what it will do.
				</p>,
				<p key="desc-2">{`Who will ${parent.name} be funding, and for how long?`}</p>,
				<p key="desc-3">{`How much will ${parent.name} pay, and how will it pay?`}</p>,
				<p key="desc-4">How long will voting on your proposal last?</p>,
			]
		) : (
			<p>{statusMessage}</p>
		);

	return (
		<MultiPageInput
			labels={inputs}
			onSubmit={deployContract}
			pageSetter={(setter) => setSetInputPage(() => setter)}
		>
			<div className={styles.formContainer} key="Info">
				<div className={`${styles.formItem} ${styles.fullFormItem}`}>
					<h1>Title</h1>
					<UnderlinedInput
						className={styles.fullWidthInput}
						placeholder="Give LEMON to Joe for lemonade stand expansion"
						startingValue={propDetails.title ?? ""}
						onChange={mutatePropField("title")}
					/>
				</div>
				<div className={styles.formItem}>
					<MultiTypeInput label="Info" onChange={metadataUploader} />
				</div>
			</div>
			<div className={styles.formContainer} key="ToFund">
				<div className={`${styles.formItem} ${styles.fullFormItem}`}>
					<h1>Address to Fund</h1>
					<GuidedAddrInput
						onChange={mutatePropField("destAddr")}
						className={styles.fullWidthInput}
					/>
				</div>
				<div className={styles.multiItemLine}>
					<div className={styles.formItem} style={{ overflowY: "visible" }}>
						<h1>Released Every</h1>
						<div className={styles.formLine}>
							<UnderlinedInput
								placeholder="1"
								startingValue=""
								onChange={(v: string) =>
									mutateRateField("interval")(parseInt(v) * timeMultiplier)
								}
								onAttemptChange={(s: string) => (isNaN(parseInt(s)) ? "" : s)}
								className={styles.shortLabel}
							/>
							<Dropdown
								options={Object.keys(timeMultipliers)}
								onChange={(unit) => setTimeMultiplier(timeMultipliers[unit])}
							/>
						</div>
					</div>
					<div className={styles.formItem}>
						<h1>Available Until</h1>
						<LocalizationProvider dateAdapter={AdapterDateFns}>
							<MobileDatePicker
								inputFormat="MM/dd/yyyy"
								value={new Date(fundingExpiry * 1000)}
								onChange={(d) => setFundingExpiry(d.getTime() / 1000)}
								renderInput={(params) => (
									<UnderlinedInput
										onClick={params.inputProps.onMouseDown}
										icon={<CalendarIcon />}
										placeholder={new Date(fundingExpiry * 1000).toString()}
										value={`${formatDate(fundingExpiry)} ${formatTime12Hr(
											new Date(fundingExpiry * 1000)
										)}`}
									/>
								)}
							/>
						</LocalizationProvider>
					</div>
				</div>
			</div>
			<div className={styles.formContainer} key="Pay">
				<div className={styles.formItem}>
					<h1>Funding Token</h1>
					<GuidedAddrInput
						onChange={mutateRateField("token")}
						className={styles.fullWidthInput}
						guides={new Set([GuideKind.Daos])}
					/>
				</div>
				<div className={`${styles.multiItemLine} ${styles.fullWidthInput}`}>
					<div className={styles.formItem}>
						<h1>Pay By</h1>
						<OutlinedOptionSelector
							options={
								propDetails.rate.token.toLowerCase() === parent.id.toLowerCase()
									? fundingKinds
									: ["Treasury Allocation"]
							}
							onChange={(option) =>
								mutateRateField("kind")(fundingKinds.indexOf(option))
							}
						/>
					</div>
					<div className={`${styles.formItem} ${styles.fullWidthInput}`}>
						<h1>
							Amount to Pay{paymentTicker !== "" ? ` (${paymentTicker})` : ""}
						</h1>
						<UnderlinedInput
							placeholder={`${propDetails.rate.value} ${paymentTicker}`}
							onAttemptChange={(s: string) => (isNaN(parseFloat(s)) ? "" : s)}
							onChange={(s: string) => mutateRateField("value")(parseFloat(s))}
							className={styles.fullWidthInput}
						/>
					</div>
				</div>
			</div>
			<div className={styles.formContainer} key="Vote">
				<div className={`${styles.formItem} ${styles.fullWidthInput}`}>
					<h1>Proposal Expiry</h1>
					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<MobileDateTimePicker
							inputFormat="MM/dd/yyyy"
							value={new Date(expiry * 1000)}
							onChange={(d) => setParsedExpiry(d.getTime() / 1000)}
							renderInput={(params) => (
								<UnderlinedInput
									onClick={params.inputProps.onMouseDown}
									icon={<CalendarIcon />}
									placeholder={new Date(expiry * 1000).toString()}
									className={styles.fullWidthInput}
									value={`${formatDate(expiry)} ${formatTime12Hr(
										new Date(expiry * 1000)
									)}`}
								/>
							)}
						/>
					</LocalizationProvider>
				</div>
			</div>
		</MultiPageInput>
	);
};
