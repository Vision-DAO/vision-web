import Web3 from "web3";
import styles from "./NewIdeaModal.module.css";
import { useState, useEffect } from "react";
import { accounts } from "../../lib/util/networks";
import CloseIcon from "@mui/icons-material/CloseRounded";
import LinearProgress from "@mui/material/LinearProgress";
import { UnderlinedInput } from "../input/UnderlinedInput";
import Idea from "../../value-tree/build/contracts/Idea.json";
import { FilledButton } from "./FilledButton";

export interface NewIdeaSubmission {
	ideaName: string;
	ideaTicker: string;
	ideaShares: number;
	datumIpfsHash: string;
}

/**
 * A popup modal containing a form with fields for the necessary argumentst to
 * the Idea smart contract constructor.
 */
export const NewIdeaModal = ({ active, onClose, onDeploy, ctx }: { active: boolean, onClose: () => void, onDeploy: (address: string) => void, ctx: [Web3, any] }) => {
	// Transition the opacity of the Idea Modal upon clicking the close button,
	// prevent the modal from being rendered at all before its opacity goes 0->100
	const [loaded, setLoaded] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	// Show a loading indicator while the user's transaction is being sent
	const [deploying, setDeploying] = useState(false);
	let style = styles.newIdeaModalContainer;

	const [web3, eth] = ctx;

	// The information to use for the user's deployed Idea smart contract
	const [ideaDetails, setIdeaDetails] = useState({});

	useEffect(() => {
		if (!loaded && active)
			setLoaded(true);

		if (loaded && !active) {
			setTimeout(() => {
				setIdeaDetails({});

				setLoaded(false);
			}, 300);
		}
	});

	if (active && loaded) {
		style += ` ${styles.active}`;
	} else if (!active && !loaded) {
		return <div style={{ display: "none" }}></div>;
	}

	// Deploys a new Idea smart contract from the callback of the Idea modal
	const createIdea = async (constructorArgs: NewIdeaSubmission) => {
		const contract = new web3.eth.Contract(Idea.abi);
		contract.deploy({
			data: Idea.bytecode,

			// See Idea.sol for definition of contract arguments.
			// Obtained from Form submission of NewIdeaModal
			arguments: [
				constructorArgs.ideaName,
				constructorArgs.ideaTicker,
				constructorArgs.ideaShares,
				constructorArgs.datumIpfsHash
			]
		})
		// TODO: Status details
			.send({
				// The first account selected should be the owner
				from: (await accounts(eth))[0],
			})
			.on("error", (e) => {
				setErrorMsg(e.message);

				setDeploying(false);
			})
			.on("transactionHash", (hash) => {
				setErrorMsg(`Deploying! Tx hash: ${hash}`);

				// Keep the user in the modal until the transaction has finished processing
				setDeploying(true);
			})
			.on("receipt", (receipt) => {
				setErrorMsg("");
				setDeploying(false);
				onDeploy(receipt.contractAddress);
			});
	};

	// Once the user clicks submit, deploy a smart contract with their specified details.
	// Validate input on:
	// - # of coins field
	const handleSubmit = () => {
		setErrorMsg("");

		// Minimum, essential fields
		if (!ideaDetails["ideaName"] || !ideaDetails["ideaTicker"] || !ideaDetails["ideaShares"]) {
			setErrorMsg("Missing required Idea field.");

			return;
		}

		// NaN or 0 are invalid
		const nShares: number = +ideaDetails["ideaShares"];

		if (nShares == 0 || isNaN(nShares)) {
			setErrorMsg("Invalid number of Idea shares.");

			return;
		}

		// Run callback with only one default value, datumIpfsHash (optional)
		createIdea({
			ideaName: ideaDetails["ideaName"],
			ideaTicker: ideaDetails["ideaTicker"],
			ideaShares: nShares,
			datumIpfsHash: ideaDetails["datumIpfsHash"] || "",
		});
	};

	// Each input in the modal updates an argument for the proceeding call to
	// the idea contract constructor. Derive onClick handles from these names
	// using the above state
	const inputs = [
		{
			placeholder: "Idea Name",
			name: "ideaName",
		},
		{
			placeholder: "Idea Abbreviation",
			name: "ideaTicker",
		},
		{
			placeholder: "# of Idea Coins",
			name: "ideaShares",
		},
		{
			placeholder: "IPFS Data Hash",
			name: "datumIpfsHash",
		},
	];

	return (
		<div className={ style }>
			<div className={ styles.modalNav }>
				<h1>Create New Idea</h1>
				<div className={ styles.closeIcon } onClick={ onClose }>
					<CloseIcon />
				</div>
			</div>
			<div className={ styles.modalForm }>
				{
					inputs.map(({ placeholder, name }) =>
						<UnderlinedInput
							key={ name }
							placeholder={ placeholder }
							onChange={ (val) => setIdeaDetails({ ...ideaDetails, [name]: val }) }
						/>
					)
				}
			</div>
			<p>{ errorMsg }</p>
			{ deploying ? <LinearProgress color="inherit" /> : <FilledButton label="Create Idea" className={ styles.submitButton } onClick={ handleSubmit } /> }
		</div>
	);
};
