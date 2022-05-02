import { AllProposalInformation, IpfsClient, IdeaData, FundingKind } from "../../../lib/util/ipfs";
import { accounts } from "../../../lib/util/networks";
import { MultiTypeInput } from "../../input/MultiTypeInput";
import { UnderlinedInput } from "../../input/UnderlinedInput";
import { OutlinedOptionSelector } from "../../input/OutlinedOptionSelector";
import { useState } from "react";
import { serialize } from "bson";
import { FilledButton } from "../../status/FilledButton";
import styles from "./NewProposalPanel.module.css";
import Proposal from "../../../value-tree/build/contracts/Prop.json";
import LinearProgress from "@mui/material/LinearProgress";
import Web3 from "web3";

// Fields that must not be null on submission
const requiredFields = ["parentAddr", "destAddr", "rate", "expiry", "dataIpfsAddr", "data"];

/**
 * Inputs for expiry times are scaled to a unit of time.
 */
const timeMultipliers = {
	"Days": 86400,
	"Hours": 3600,
	"Minutes": 60,
	"Seconds": 1,
};

/**
 * A section of the proposals page that allows a user to deploy new proposals.
 */
export const NewProposalPanel = ({ web3, eth, ipfs, parentAddr, onSubmit }: { web3: Web3, eth: any, ipfs: IpfsClient, parentAddr: string, onSubmit: (prop: AllProposalInformation) => void }) => {
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [deploying, setDeploying] = useState<boolean>(false);

	// The number of seconds to multiply the input by (e.g., days, hours, minutes)
	const [timeMultiplier, setTimeMultiplier] = useState<number>(86400);
	const [expiry, setParsedExpiry] = useState<number>(0);

	// Default form values. ALL are required
	const [propDetails, setPropDetails] = useState<AllProposalInformation>({
		parentAddr,
		destAddr: "",
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
		data: [],
		addr: ""
	});

	// Handles uploading the metadata from the new proposal form to IPFS.
	const metadataUploader = async (data: IdeaData[]) => {
		// Upload the data to IPFS, and set the new form value
		const cid = (await ipfs.add(new Uint8Array(serialize(data)))).cid.toString();
		setPropDetails(details => { return { ...details, data: data, dataIpfsAddr: cid }; });
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

		contract.deploy({
			data: Proposal.bytecode,
			arguments: [
				propDetails.parentAddr,
				propDetails.destAddr,
				propDetails.rate.token,
				propDetails.rate.kind,
				propDetails.dataIpfsAddr,
				expiry * timeMultiplier,
			]
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

				onSubmit(propDetails);
			});
	};

	const setFundingKind = (kind: string) => {
		const properKinds = {
			"Treasury": FundingKind.Treasury,
			"Mint": FundingKind.Mint,
		};

		setPropDetails(details => {
			return {
				...details,
				rate: { ...details.rate, kind: properKinds[kind] }
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

	return (
		<div className={ styles.formContainer }>
			<div className={ styles.formItemList }>
				<div className={ styles.formItem }>
					<h2>Contract to Fund</h2>
					<UnderlinedInput placeholder="0xABCDEFG" startingValue="" onChange={ (toFund) => setPropDetails(details => { return {...details, destAddr: toFund }; }) } />
				</div>
				<div className={ styles.formItem }>
					<h2>Funding Token (ERC20)</h2>
					<UnderlinedInput placeholder="0xABCDEFG" startingValue="" onChange={ (token) => setPropDetails(details => { return {...details, rate: { ...details.rate, token: token }}; }) } />
				</div>
			</div>
			<div className={ `${styles.formItem}` }>
				<h2>Expires In</h2>
				<div className={ styles.formLine }>
					<UnderlinedInput placeholder="1" startingValue="" onChange={ setExpiry } />
					<OutlinedOptionSelector options={ Object.keys(timeMultipliers) } onChange={ (unit) => { setTimeMultiplier(timeMultipliers[unit]); } } onClear={ () => setTimeMultiplier(1) } />
				</div>
			</div>
			<div className={ styles.formItem }>
				<h2>Funding Type</h2>
				<OutlinedOptionSelector options={ ["Mint", "Treasury"] } onChange={ setFundingKind } onClear={ () => ({}) } />
			</div>
			<div className={ styles.formItem }>
				<MultiTypeInput label="Proposal Metadata" onChange={ metadataUploader } />
			</div>
			<div className={ styles.submitContainer }>
				{ statusMessage && statusMessage !== "" && <p>{ statusMessage }</p> }
				{ deploying && <LinearProgress color="inherit" /> }
				<FilledButton className={ styles.submitButton } onClick={ deployContract } label="Create Proposal" />
			</div>
		</div>
	);
};
