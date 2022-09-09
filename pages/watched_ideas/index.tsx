import { useWatchedIdeas } from "../../lib/util/discovery";
import { useStream } from "../../lib/util/graph";
import { useState } from "react";
import { IdeaDetailCard } from "../../components/workspace/IdeaDetailCard";
import { IdeaMap } from "../../components/workspace/IdeaMap";
import { GetDaoInfoQuery, GetMapItemsQuery } from "../../.graphclient";
import styles from "../index.module.css";

/**
 * Registries deployed to different networks (used for bootstrapping).
 */
export const registries: Map<string, string | null> = new Map([
	["ethereum", null],
	["polygon", null],
	["polygon-test", "0xBEAA7efE5FfE5B018235a406a9378762fac44BDc"],
]);

/**
 * A navigable page rendering a mind map of ideas minted on vision.
 */
export const Index = () => {
	// The IPFS context should always be available since we are inside the
	// networked UI context. Render the list of parents from this context,
	// and update it later if need be
	const [activeIdea, setActiveIdea] = useState<string>(undefined);
	const activeIdeaInfo = useStream<GetDaoInfoQuery>(
		undefined,
		(graph) => graph.GetDaoInfo({ id: activeIdea }),
		[activeIdea]
	);

	// Ideas are discovered through other peers informing us of them, through
	// locally existing ones (e.g., that were created on vision.eco),
	// and through entries in the registry smart contract.
	const watchedIdeas = useWatchedIdeas();

	const possibleIdeas = useStream<GetMapItemsQuery | null>(
		{ ideas: [], props: [] },
		(graph) => graph.GetMapItems({}),
		[]
	);
	const allIdeas = {
		ideas: possibleIdeas.ideas.filter((idea) => watchedIdeas.has(idea.id)),
		props: [],
	};

	const loadIdeaCard = async (id: string) => {
		setActiveIdea(id);
	};

	const [, setMapSelected, , , setMapZoom, map] = IdeaMap({
		ideas: allIdeas,
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
					{activeIdeaInfo !== undefined && (
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
