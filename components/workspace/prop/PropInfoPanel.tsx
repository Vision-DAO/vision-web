import {
	ConnStatus,
	formatErc,
	formatDateObj as formatDate,
} from "../../../lib/util/networks";
import {
	IpfsClient,
	useActorTitle,
	useIdeaDescription,
} from "../../../lib/util/ipfs";
import styles from "./PropInfoPanel.module.css";
import { PropInfo } from "../../../lib/util/proposals/module";
import { PropFlowIndicator } from "./PropFlowIndicator";
import { formatTime12Hr } from "../idea/activity/ActivityEntry";
import Web3 from "web3";

export const PropInfoPanel = ({
	web3,
	ipfs,
	conn,
	prop,
}: {
	web3: Web3;
	ipfs: IpfsClient;
	conn: ConnStatus;
	prop: PropInfo;
}) => {
	const description = useIdeaDescription(prop.ipfsAddr);
	const expiry = new Date(Number(prop.expiration) * 1000);
	const destName = useActorTitle(prop.toFund);

	const metrics = {
		"Funding Type": prop.rate.kind,
		"Funding Amount": formatErc(Number(prop.rate.value)),
		Spent: prop.rate.spent ? "Yes" : "No",
		"Users Voted": prop.voters.length,
		[new Date() > expiry ? "Expired" : "Expires"]: `${formatDate(
			expiry
		)} ${formatTime12Hr(expiry)}`,
	};

	return (
		<div className={styles.infoContainer}>
			<div className={styles.basicText}>
				<h1>Proposal: {prop.title}</h1>
				<p className={styles.propDescription}>
					<b>Description:</b> {description}
				</p>
			</div>
			<div className={styles.metricList}>
				{Object.entries(metrics).map(([name, textDisp]) => (
					<div key={name} className={styles.metricLine}>
						<p>{name}</p>
						<p>{textDisp}</p>
					</div>
				))}
			</div>
			<PropFlowIndicator
				ipfs={ipfs}
				prop={prop}
				dest={destName}
				conn={conn}
				web3={web3}
			/>
		</div>
	);
};
