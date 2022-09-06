import { FilledButton } from "../../../components/status/FilledButton";
import { GeneralModal } from "../../../components/status/GeneralModal";
import { GetPropsQuery, GetPropsDocument } from "../../../.graphclient";
import { IpfsContext } from "../../../lib/util/ipfs";
import { CircularProgress } from "@mui/material";
import { useWeb3 } from "../../../lib/util/web3";
import { useStream } from "../../../lib/util/graph";
import { ModalContext } from "../../../lib/util/modal";
import { DetailNavigatorLayout } from "../../../components/workspace/DetailNavigatorLayout";
import { ProposalsList } from "../../../components/workspace/prop/ProposalsList";
import { useContext, ReactElement, useState, useEffect } from "react";
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
	const [currTime, setCurrTime] = useState<Date>(new Date());
	const router = useRouter();
	const proposals = useStream<GetPropsQuery>(
		undefined,
		(graph) =>
			graph.GetProps({
				id: idea.id,
				dayStart: Math.floor(currTime.getTime() / 1000),
			}),
		[idea.id, Math.floor(currTime.getTime() / 1000)]
	);

	// When the user deploys a new proposal, this modal is used
	const [, setModal] = useContext(ModalContext);

	useEffect(() => {
		const updater = setInterval(() => {
			setCurrTime(new Date());
		}, 5000);

		return () => {
			clearInterval(updater);
		};
	}, []);

	const newPropModalContent = (
		<GeneralModal title={`New Proposal: ${idea.name}`}>
			<NewProposalPanel
				ipfs={ipfs}
				web3={web3}
				eth={eth}
				parent={idea}
				parentAddr={idea.id}
				onDeploy={() => setModal(null)}
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
					{proposals !== undefined ? (
						<ProposalsList
							eth={eth}
							ipfs={ipfs}
							web3={web3}
							proposals={proposals.idea.activeProps}
							onSelectProp={(addr) => router.push(`/proposals/${addr}/about`)}
						/>
					) : (
						<CircularProgress />
					)}
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
