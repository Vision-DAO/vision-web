import { ExtendedIdeaInformation } from "../../../components/workspace/IdeaDetailCard";
import { FilledButton } from "../../../components/status/FilledButton";
import { GeneralModal } from "../../../components/status/GeneralModal";
import { ActiveIdeaContext, useProposals, useFundedChildren, IpfsContext, AllProposalInformation, GossipProposalInformation } from "../../../lib/util/ipfs";
import { useWeb3 } from "../../../lib/util/web3";
import { ModalContext } from "../../../lib/util/modal";
import { DetailNavigatorLayout } from "../../../components/workspace/DetailNavigatorLayout";
import { ProposalsList } from "../../../components/workspace/prop/ProposalsList";
import { useContext, ReactElement } from "react";
import { IdeaChildrenList } from "../../../components/workspace/idea/IdeaChildrenList";
import { NewProposalPanel } from "../../../components/workspace/prop/NewProposalPanel";
import dashStyles from "./about.module.css";
import styles from "./proposals.module.css";
import { useRouter } from "next/router";
import { pages, loader } from "./module";

/**
 * Renders a list of the current proposals active on IPFS.
 */
export const Proposals = () => {
	// See NavigatorLayout container. This will never be NULL
	const [idea, ]: [ExtendedIdeaInformation, unknown] = useContext(ActiveIdeaContext);
	const [proposals, pub] = useProposals(idea.addr);
	const [web3, eth] = useWeb3();
	const ipfs = useContext(IpfsContext);
	const [rates, ideas] = useFundedChildren(idea.addr, web3, ipfs);
	const router = useRouter();

	// When the user deploys a new proposal, this modal is used
	const [, setModal] = useContext(ModalContext);

	const pubProposal = (prop: AllProposalInformation) => {
		const propData: GossipProposalInformation = {
			dataIpfsAddr: prop.dataIpfsAddr,
			addr: prop.addr,
		};

		pub(propData);
		setModal(null);
	};

	const newPropModalContent = (
		<GeneralModal title="New Proposal">
			<NewProposalPanel ipfs={ ipfs } web3={ web3 } eth={ eth } onSubmit={ pubProposal } parentAddr={ idea.addr } />
		</GeneralModal>
	);

	return (
		<div className={ `${dashStyles.infoContainers} ${styles.infoContainers}` }>
			<div className={ styles.proposalLists }>
				<div className={ styles.proposalList }>
					<h2>New Proposals</h2>
					<ProposalsList eth={ eth } ipfs={ ipfs } web3={ web3 } proposals={ proposals } onSelectProp={ (addr) => router.push(`/proposals/${addr}/about`) } />
				</div>
				<div className={ styles.proposalList }>
					<h2>Funded Ideas</h2>
					<IdeaChildrenList parentAddr={ idea.addr } rates={ rates } ideas={ ideas } web3={ web3 } eth={ eth } />
				</div>
			</div>
			<FilledButton label="Create New Proposal" onClick={ () => setModal(newPropModalContent) } className={ styles.newPropButton } />
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
Proposals.getLayout = (page: ReactElement) => <DetailNavigatorLayout title="Idea" pages={ pages } loader={ loader } ctx={ ActiveIdeaContext }>{ page }</DetailNavigatorLayout>;

export default Proposals;
