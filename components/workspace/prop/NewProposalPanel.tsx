import { IpfsClient, IdeaData, useProfiles } from "../../../lib/util/ipfs";
import { accounts } from "../../../lib/util/networks";
import { MultiTypeInput } from "../../input/MultiTypeInput";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { MultiPageInput } from "../../input/MultiPageInput";
import { GuidedAddrInput } from "../../input/GuidedAddrInput";
import { useState } from "react";
import { serialize } from "bson";
import { FilledButton } from "../../status/FilledButton";
import { OutlinedOptionSelector } from "./OutlinedOptionSelector";
import styles from "./NewProposalPanel.module.css";
import Proposal from "../../../value-tree/build/contracts/Prop.json";
import LinearProgress from "@mui/material/LinearProgress";
import Web3 from "web3";
import { GetDaoAboutQuery } from "../../../.graphclient";

// Fields that must not be null on submission
const requiredFields = [
	"title",
	"parentAddr",
	"destAddr",
	"rate",
	"expiry",
	"dataIpfsAddr",
	"data",
];

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
}: {
	web3: Web3;
	eth: any;
	ipfs: IpfsClient;
	parentAddr: string;
	parent: GetDaoAboutQuery["idea"];
}) => {
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [deploying, setDeploying] = useState<boolean>(false);

	// The number of seconds to multiply the input by (e.g., days, hours, minutes)
	const [timeMultiplier, setTimeMultiplier] = useState<number>(86400);
	const [expiry, setParsedExpiry] = useState<number>(0);

	// Default form values. ALL are required
	const [propDetails, setPropDetails] = useState<AllProposalInformation>({
		parentAddr,
		destAddr: "",
		address: "",
		rate: {
			token: "",
			value: 0,
			kind: null,
			interval: 0,
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

	const mutatePropField =
		<T,>(field: string) =>
		(val: T) =>
			setPropDetails((details) => {
				return { [field]: val, ...details };
			});

	// Handles uploading the metadata from the new proposal form to IPFS.
	const metadataUploader = async (data: IdeaData[]) => {
		// Upload the data to IPFS, and set the new form value
		const cid = (
			await ipfs.add(new Uint8Array(serialize(data)))
		).cid.toString();
		setPropDetails((details: AllProposalInformation) => {
			return { ...details, data: data, dataIpfsAddr: cid };
		});
	};

	/**
	 * Attempts to deploy the contract, displaying an error message otherwise.
	 */
	const deployContract = async () => {
		for (const key of requiredFields) {
			if (key === "expiry") {
				if (expiry === 0) {
					setStatusMessage(() => "Invalid expiry date.");

					return;
				}

				continue;
			}

			if (propDetails[key] === null || !propDetails[key]) {
				setStatusMessage(() => "Missing required proposal fields.");

				return;
			}
		}

		if (propDetails.rate.kind === null) {
			setStatusMessage(() => "Missing required proposal fields.");

			return;
		}

		const contract = new web3.eth.Contract(Proposal.abi);

		contract
			.deploy({
				data: Proposal.bytecode,
				arguments: [
					propDetails.title,
					propDetails.parentAddr,
					propDetails.destAddr,
					propDetails.rate.token,
					propDetails.rate.kind,
					propDetails.dataIpfsAddr,
					expiry * timeMultiplier,
				],
			})
			.send({
				from: (await accounts(eth))[0],
			})
			.on("error", (e) => {
				setStatusMessage(e.message);

				setDeploying(false);
			})
			.on("transactionHash", (hash) => {
				setStatusMessage(`Deploying! Tx hash: ${hash}`);

				setDeploying(true);
			})
			.on("receipt", (receipt) => {
				setStatusMessage("");
				setDeploying(false);

				propDetails.addr = receipt.contractAddress;
			});
	};

	const setFundingKind = (kind: string) => {
		const properKinds = {
			Treasury: FundingKind.Treasury,
			Mint: FundingKind.Mint,
		};

		setPropDetails((details: AllProposalInformation) => {
			return {
				...details,
				rate: { ...details.rate, kind: properKinds[kind] },
			};
		});
	};

	const setExpiry = (expiry: string) => {
		// The number of days the proposal should last for
		const num = parseInt(expiry);

		if (isNaN(num)) {
			setStatusMessage("Invalid integer value.");
			return;
		}

		setParsedExpiry(num);
	};

	const inputs = [
		"Make your proposal stand out by describing what it will do.",
		`Who will ${parent.name} be funding, and for how long?`,
		`How much will ${parent.name} pay, and how will it pay?`,
	];

	return (
		<MultiPageInput labels={inputs} onSubmit={deployContract}>
			<div className={styles.formContainer} key="Info">
				<div className={`${styles.formItem} ${styles.fullFormItem}`}>
					<h1>Title</h1>
					<UnderlinedInput
						className={styles.fullWidthInput}
						placeholder="Give LEMON to Joe for lemonade stand expansion"
						startingValue=""
						onChange={mutatePropField("title")}
					/>
				</div>
				<div className={styles.formItem}>
					<MultiTypeInput label="Info" onChange={metadataUploader} />
				</div>
			</div>
			<div className={styles.formContainer} key="ToFund">
				<h1>Address to Fund</h1>
				<GuidedAddrInput
					onChange={mutatePropField("destAddr")}
					className={styles.fullWidthInput}
				/>
			</div>
			<div className={styles.formContainer} key="Pay"></div>
		</MultiPageInput>
	);
};
