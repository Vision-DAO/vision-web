import { IpfsClient } from "../../../lib/util/ipfs";
import styles from "./ProposalsList.module.css";
import { GetPropsQuery } from "../../../.graphclient";
import { ProposalLine } from "./ProposalLine";

/**
 * Renders a list of gossiped proposals.
 */
export const ProposalsList = ({
	proposals,
	onSelectProp,
}: {
	eth: any;
	ipfs: IpfsClient;
	proposals:
		| GetPropsQuery["idea"]["children"]
		| GetPropsQuery["idea"]["activeProps"];
	onSelectProp?: (addr: string, prop: string) => void;
}) => {
	return (
		<div className={styles.list}>
			{proposals.map((prop) => (
				<ProposalLine prop={prop} />
			))}
		</div>
	);
};
