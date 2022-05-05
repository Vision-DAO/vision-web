import { ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { ConnStatus } from "../../../lib/util/networks"; 
import { IpfsClient } from "../../../lib/util/ipfs";
import styles from "./PropInfoPanel.module.css";
import { PropFlowIndicator } from "./PropFlowIndicator";
import { useState, useEffect } from "react";
import { formatDate } from "../prop/ProposalLine";
import { resolveIdeaName } from "../../../lib/util/discovery";
import Web3 from "web3";

export const PropInfoPanel = ({ web3, ipfs, conn, prop }: { web3: Web3, ipfs: IpfsClient, conn: ConnStatus, prop: ExtendedProposalInformation }) => {
	const [destName, setDestName] = useState<string>("");
	let description = "This proposal does not have a description.";

	// Turn the address that the funds are being sent to into an Idea name, if
	// it is an idea.
	useEffect(() => {
		if (destName == "") {
			(async () => {
				setDestName(await resolveIdeaName(web3, conn, prop.destAddr));
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
		"Funding Interval": prop.rate.interval,
		"Funding Type": fundingTypes[prop.rate.kind],
		"Funding Amount": prop.rate.value,
		"Users Voted": prop.nVoters,
		[new Date() > prop.expiry ? "Expired" : "Expires"]: formatDate(prop.expiry),
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
