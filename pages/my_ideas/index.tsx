import { accounts } from "../../lib/util/networks";
import { useStream } from "../../lib/util/graph";
import { useWeb3 } from "../../lib/util/web3";
import { useState, useEffect } from "react";
import { IdeaDetailCard } from "../../components/workspace/IdeaDetailCard";
import { IdeaMap } from "../../components/workspace/IdeaMap";
import {
	GetDaoInfoQuery,
	GetDaoInfoDocument,
	GetMapItemsOwnedQuery,
	GetMapItemsOwnedDocument,
} from "../../.graphclient";
import styles from "../index.module.css";

/**
 * Registries deployed to different networks (used for bootstrapping).
 */
export const registries: Map<string, string | null> = new Map([
	["ethereum", null],
	["polygon", null],
	["arbitrum-one", "0x4298c83d06e02EB419ee214fc5Eb4848d9f75cE1"],
	["arbitrum-test", "0x33B1b6e896f1484cd7bdD76A60F058eDFaF8a158"],
]);

/**
 * A navigable page rendering a mind map of ideas minted on vision.
 */
export const Index = () => {
	const [userAddr, setUserAddr] = useState<string>(undefined);
	const [, eth] = useWeb3();

	// The IPFS context should always be available since we are inside the
	// networked UI context. Render the list of parents from this context,
	// and update it later if need be
	const [activeIdea, setActiveIdea] = useState<string>(undefined);
	const activeIdeaInfo = useStream<GetDaoInfoQuery>(
		undefined,
		(graph) =>
			activeIdea === undefined
				? undefined
				: graph.GetDaoInfo({ id: activeIdea }),
		[activeIdea]
	);

	// Ideas are discovered through other peers informing us of them, through
	// locally existing ones (e.g., that were created on vision.eco),
	// and through entries in the registry smart contract.
	const allIdeas = useStream<GetMapItemsOwnedQuery | null>(
		{ user: { ideas: [] } },
		(graph) =>
			userAddr !== undefined
				? graph.GetMapItemsOwned({ id: userAddr })
				: undefined,
		[userAddr]
	);

	useEffect(() => {
		(async () => {
			setUserAddr((await accounts(eth))[0]);
		})();
	}, []);

	const loadIdeaCard = async (id: string) => {
		setActiveIdea(id);
	};

	const [, setMapSelected, , , setMapZoom, map] = IdeaMap({
		ideas: {
			ideas: (allIdeas.user?.ideas ?? [])
				.filter(
					(idea: GetMapItemsOwnedQuery["user"]["ideas"][0]) =>
						idea.tokens.balance > 0
				)
				.map((idea) => idea.dao),
			props: [],
		},
		onClickIdea: (idea) => loadIdeaCard(idea),
	});
	return (
		<div className={styles.browser}>
			{map}
			<div className={styles.hudArea}>
				<div className={styles.hud}>
					<div className={`${styles.leftActionButton} ${styles.soloButton}`}>
						<div className={styles.zoomButtons}>
							<div
								className={styles.zoomButton}
								onClick={() => setMapZoom(1.1)}
							>
								+
							</div>
							<div
								className={styles.zoomButton}
								onClick={() => setMapZoom(0.9)}
							>
								-
							</div>
						</div>
					</div>
					{activeIdea !== undefined && activeIdeaInfo !== undefined && (
						<div className={styles.ideaDetailsPanel}>
							<IdeaDetailCard
								idea={activeIdeaInfo}
								onClose={() => {
									setActiveIdea(undefined);
									setMapSelected(undefined);
								}}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Index;
