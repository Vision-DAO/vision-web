import { FilledButton } from "../../../components/status/FilledButton";
import { GeneralModal } from "../../../components/status/GeneralModal";
import { IpfsContext } from "../../../lib/util/ipfs";
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
import {
	pages,
	loader,
	ActiveIdeaContext,
	titleExtractor,
} from "../../../lib/util/ideas/module";

/**
 * Renders a list of the current proposals active on IPFS.
 */
export const Proposals = () => {
	// See NavigatorLayout container. This will never be NULL
	const [idea] = useContext(ActiveIdeaContext);
	const [web3, eth] = useWeb3();
	const ipfs = useContext(IpfsContext);
	const router = useRouter();

	// When the user deploys a new proposal, this modal is used
	const [, setModal] = useContext(ModalContext);

	const newPropModalContent = (
		<GeneralModal title="New Proposal">
			<NewProposalPanel
				ipfs={ipfs}
				web3={web3}
				eth={eth}
				parentAddr={idea.id}
			/>
		</GeneralModal>
	);

	/*
					<div className={styles.proposalList}>
					<h2>Funded Ideas</h2>
					<IdeaChildrenList
						parentAddr={idea.id}
						rates={idea.children}
						ideas={idea.children}
						web3={web3}
						eth={eth}
					/>
				</div>*/

	return (
		<div className={`${dashStyles.infoContainers} ${styles.infoContainers}`}>
			<div className={styles.proposalLists}>
				<div className={styles.proposalList}>
					<h2>New Proposals</h2>
					<ProposalsList
						eth={eth}
						ipfs={ipfs}
						web3={web3}
						proposals={idea.activeProps}
						onSelectProp={(addr) => router.push(`/proposals/${addr}/about`)}
					/>
				</div>
			</div>
			<FilledButton
				label="Create New Proposal"
				onClick={() => setModal(newPropModalContent)}
				className={styles.newPropButton}
			/>
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
Proposals.getLayout = (page: ReactElement) => (
	<DetailNavigatorLayout
		title="Idea"
		contentTitle={titleExtractor}
		pages={pages}
		loader={loader}
		ctx={ActiveIdeaContext}
	>
		{page}
	</DetailNavigatorLayout>
);

export default Proposals;
