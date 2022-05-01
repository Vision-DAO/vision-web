import { ExtendedIdeaInformation } from "../../../components/workspace/IdeaDetailCard";
import { ActiveIdeaContext, useProposals, IpfsContext, AllProposalInformation, GossipProposalInformation } from "../../../lib/util/ipfs";
import { useWeb3 } from "../../../lib/util/web3";
import { IdeaDetailNavigatorLayout } from "../../../components/workspace/IdeaDetailNavigatorLayout";
import { ProposalsList } from "../../../components/workspace/prop/ProposalsList";
import { useContext, ReactElement } from "react";
import { NewProposalPanel } from "../../../components/workspace/prop/NewProposalPanel";
import dashStyles from "./about.module.css";
import styles from "./proposals.module.css";

/**
 * Renders a list of the current proposals active on IPFS.
 */
export const Proposals = () => {
	// See NavigatorLayout container. This will never be NULL
	const [idea, ]: [ExtendedIdeaInformation, unknown] = useContext(ActiveIdeaContext);
	const [proposals, pub] = useProposals(idea.addr);
	const [web3, eth] = useWeb3();
	const ipfs = useContext(IpfsContext);

	const pubProposal = (prop: AllProposalInformation) => {
		const propData: GossipProposalInformation = {
			dataIpfsAddr: prop.dataIpfsAddr,
			addr: prop.addr,
		};

		pub(propData);
	};

	return (
		<div className={ `${dashStyles.infoContainers} ${styles.infoContainers}` }>
			<ProposalsList proposals={ proposals } />
			<NewProposalPanel ipfs={ ipfs } web3={ web3 } eth={ eth } onSubmit={ pubProposal } parentAddr={ idea.addr } />
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
Proposals.getLayout = (page: ReactElement) => <IdeaDetailNavigatorLayout>{ page }</IdeaDetailNavigatorLayout>;

export default Proposals;
