import { BasicIdeaInformation } from "../IdeaBubble";
import Web3 from "web3";
import { OutlinedListEntry } from "../../status/OutlinedListEntry";
import { FundingRate } from "../../../lib/util/ipfs";
import { accounts } from "../../../lib/util/networks";
import { formatDate } from "../prop/ProposalLine";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import { formatInterval } from "../prop/PropInfoPanel";
import { GeneralModal } from "../../status/GeneralModal";
import { FilledButton } from "../../status/FilledButton";
import { ModalContext } from "../../../lib/util/modal";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import { AbiItem } from "web3-utils";
import { useContext, useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import styles from "../prop/ProposalsList.module.css";
import siblingStyles from "../prop/ProposalLine.module.css";

// See previous TODO on modularity
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

/**
 * Renders a list of children that have been funded by a parent, allowing
 * funds to be released for any of the children.
 */
export const IdeaChildrenList = ({ parentAddr, rates, ideas, web3, eth }: { parentAddr: string, rates: { [idea: string]: FundingRate }, ideas: { [idea: string]: BasicIdeaInformation }, web3: Web3, eth: any }) => {
	// Used for showing the user errors
	const [, setModal] = useContext(ModalContext);
	const items = Object.entries(rates)
		.map(([addr, rate]) => [ideas[addr], rate]);
	const [parentContract, setParentContract] = useState(undefined);
	const [fundsReleasing, setFundsReleasing] = useState<{ [address: string]: boolean }>({});
	const [tokenTickers, setTokenTicker] = useState<{ [address: string]: string }>({});
	const [tokenDecimals, setTokenDecimals] = useState<{ [token: string]: number }>({});

	// Brings up a modal displaying some information
	const displayModal = (title: string, msg: string) => {
		setModal(<GeneralModal title={ title }><p>{ msg }</p></GeneralModal>);
	};

	/**
	 * Triggers a funding round for the indicated child node.
	 */
	const onActivateFunding = async (addr: string) => {
		try {
			await parentContract.methods.disperseFunding(addr).send({ from: (await accounts(eth))[0] })
				.on("error", (e) => {
					displayModal("Error", `Failed to disperse funding: ${e}`);
				})
				.on("transactionHash", (hash) => {
					setFundsReleasing(prev => { return { ...prev, [addr]: true }; });
				})
				.then(() => {
					setFundsReleasing(prev => { return { ...prev, [addr]: false }; });

					displayModal("Success", "The requested funds have been released.");
				});
		} catch (e) {
			displayModal("Error", e);
		}
	};

	useEffect(() => {
		if (parentContract === undefined)
			setParentContract(new web3.eth.Contract(Idea.abi, parentAddr));
	});

	return (
		<div>
			<OutlinedListEntry styles={{ roundTop: true, roundBottom: false, altColor: true }}>
				<p><b>Funded</b></p>
				<p><b>Funding Rate</b></p>
				<p><b>Funded Every</b></p>
				<p><b>Funded Until</b></p>
				<p style={{ opacity: "0%" }}>Release Funds</p>
			</OutlinedListEntry>
			{ items.length > 0 ? items.map(([idea, rate]: [BasicIdeaInformation, FundingRate], i) => {
				// Queue the indicated token for resolution if it is not available
				if (!(rate.token in tokenTickers)) {
					// Mark the item as loading
					setTokenTicker(tickers => { return { ...tickers, [rate.token]: null }; });

					// Load the ticker and decimals for the indicated token for human readability
					(async () => {
						const contract = new web3.eth.Contract(erc20Abi, rate.token);
						const symbol = await contract.methods.symbol().call();
						const points = await contract.methods.decimals().call();
						setTokenTicker(tickers => { return { ...tickers, [rate.token]: symbol }; });
						setTokenDecimals(decimals => { return { ...decimals, [rate.token]: parseInt(points) }; });
					})();
				}

				return (<OutlinedListEntry key={ idea.addr } styles={{ roundTop: false, roundBottom: i === items.length - 1 }}>
					<p><b>{ idea.title }</b></p>
					<p><b>{ (rate.value / (10 ** (tokenDecimals[rate.token] ?? 1))).toLocaleString() } { tokenTickers[rate.token] != null ? tokenTickers[rate.token] : rate.token }</b></p>
					<p><b>{ formatInterval(rate.interval) }</b></p>
					<p><b>{ formatDate(rate.expiry) } { formatTime12Hr(rate.expiry) }</b></p>
					{ fundsReleasing[idea.addr] ?
						<CircularProgress />
						:
						<p className={ `${siblingStyles.labelButton} ${siblingStyles.labelDone}` } onClick={ () => onActivateFunding(idea.addr) }>Release Funds</p>
					}
				</OutlinedListEntry>
				); }) : <OutlinedListEntry styles={{ className: styles.spacedList, roundTop: false, roundBottom: true }}><p>No funded ideas found.</p></OutlinedListEntry> }
		</div>
	);
};
