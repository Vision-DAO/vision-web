import { ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { ConnStatus } from "../../../lib/util/networks"; 
import { IpfsClient } from "../../../lib/util/ipfs";
import styles from "./PropInfoPanel.module.css";
import { PropFlowIndicator } from "./PropFlowIndicator";
import { useState, useEffect } from "react";
import { formatBig } from "./PropVotePanel";
import { AbiItem } from "web3-utils";
import { formatDate } from "../prop/ProposalLine";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import { resolveIdeaName } from "../../../lib/util/discovery";
import Web3 from "web3";

/**
 * Prints out a second interval as a prefixed, formatted string.
 *
 * This is lazy as shit idc.
 */
export const formatInterval = (interval: number): string => {
	if (interval < 60) {
		return `${interval} Second${interval != 1 ? "s" : ""}`;
	}

	if (interval < 3600) {
		return `${interval / 60} Minute${interval / 60 != 1 ? "s" : ""}`;
	}

	if (interval < 86400) {
		return `${interval / 3600} Hour${interval / 3600 != 1 ? "s" : ""}`;
	}

	return `${interval / 86400} Day${interval / 86400 != 1 ? "s" : ""}`;
};

export const PropInfoPanel = ({ web3, ipfs, conn, prop }: { web3: Web3, ipfs: IpfsClient, conn: ConnStatus, prop: ExtendedProposalInformation }) => {
	const [destName, setDestName] = useState<string>("");
	const [fundingTokenDecimals, setFundingTokenDecimals] = useState<number>(undefined);
	let description = "This proposal does not have a description.";

	// Turn the address that the funds are being sent to into an Idea name, if
	// it is an idea.
	useEffect(() => {
		if (destName == "") {
			(async () => {
				setDestName(await resolveIdeaName(web3, conn, prop.destAddr));
			})();
		}

		if (fundingTokenDecimals === undefined) {
			(async () => {
				// We only need the number of decimals for the token funding the proposal
				const erc20Abi: AbiItem[] = [
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

				const tokenContract = new web3.eth.Contract(erc20Abi, prop.rate.token);
				setFundingTokenDecimals(parseInt(await tokenContract.methods.decimals().call()));
			})();
		}
	});

	// The last utf-8 text entry is the proposal's description
	if (!Array.isArray(prop.data))
		prop.data = Object.values(prop.data);

	for (const data of prop.data) {
		if (data.kind === "utf-8") {
			description = (new TextDecoder()).decode(data.data);
		}
	}

	const fundingTypes = ["Treasury", "Mint"];

	const metrics = {
		"Funding Interval": formatInterval(prop.rate.interval),
		"Funding Type": fundingTypes[prop.rate.kind],
		"Funding Amount": formatBig(prop.rate.value / (10 ** fundingTokenDecimals), 2),
		"Users Voted": prop.nVoters,
		[new Date() > prop.expiry ? "Expired" : "Expires"]: `${formatDate(prop.expiry)} ${formatTime12Hr(prop.expiry)}`,
	};

	return (
		<div className={ styles.infoContainer }>
			<div className={ styles.basicText }>
				<h1>Proposal: { prop.title }</h1>
				<p className={ styles.propDescription }><b>Description:</b> { description }</p>
			</div>
			<div className={ styles.metricList }>
				{
					Object.entries(metrics)
						.map(([name, textDisp]) =>
							<div key={ name } className={ styles.metricLine }>
								<p>{ name }</p>
								<p>{ textDisp }</p>
							</div>
						)
				}
			</div>
			<PropFlowIndicator ipfs={ ipfs } prop={ prop } dest={ destName } conn={ conn } web3={ web3 } />
		</div>
	);
};
