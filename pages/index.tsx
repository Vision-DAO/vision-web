import { useWeb3 } from "../lib/util/web3";
import { IpfsContext } from "../lib/util/ipfs";
import { ModalContext } from "../lib/util/modal";
import { orSingleIter } from "../lib/util/graph";
import { serialize } from "bson";
import { useState, useContext, useEffect } from "react";
import { BasicIdeaInformation } from "../components/workspace/IdeaBubble";
import { IdeaDetailCard } from "../components/workspace/IdeaDetailCard";
import { NewIdeaModal } from "../components/status/NewIdeaModal";
import { FilledButton } from "../components/status/FilledButton";
import { IdeaMap } from "../components/workspace/IdeaMap";
import { SearchBar } from "../components/workspace/SearchBar";
import { useRouter } from "next/router";
import styles from "./index.module.css";

import {
	GetMapItemsDocument,
	GetMapItemsQuery,
	subscribe,
} from "../.graphclient";

/**
 * Registries deployed to different networks (used for bootstrapping).
 */
export const registries: Map<string, string | null> = new Map([
	["ethereum", null],
	["polygon", null],
	["polygon-test", "0x704289F005639D5D327897ddb251Fdbea4b80510"],
]);

/**
 * A navigable page rendering a mind map of ideas minted on vision.
 */
export const Index = () => {
	// The IPFS context should always be available since we are inside the
	// networked UI context. Render the list of parents from this context,
	// and update it later if need be
	const [activeIdea, setActiveIdea] = useState(undefined);
	const [web3, eth] = useWeb3();
	const ipfs = useContext(IpfsContext);
	const router = useRouter();
	const [modal] = useContext(ModalContext);
	const [allIdeas, setAllIdeas] = useState<GetMapItemsQuery | null>({
		ideas: [],
		props: [],
	});

	useEffect(() => {
		(async () => {
			const stream = await subscribe(GetMapItemsDocument, {});

			for await (const map of orSingleIter(stream)) {
				setAllIdeas(map.data);
			}
		})();
	}, []);

	// Display items as a map of bubbles
	const [creatingIdea, setCreatingIdea] = useState(false);

	const loadIdeaCard = async (id: string) => {
		setActiveIdea(null);

		setActiveIdea(null);
	};

	const [cyx, setMapSelected, setMapHovered, setMapDehovered, setMapZoom, map] =
		IdeaMap({
			ideas: allIdeas,
			onClickIdea: (idea) => loadIdeaCard(idea),
		});

	// Every time the user refreshes the page, show the idea slected in the URL
	useEffect(() => {
		if ("idea" in router.query && cyx !== undefined) {
			const { idea } = router.query;
			const id = Array.isArray(idea) ? idea[0] : idea;

			setMapSelected(id);
			loadIdeaCard(id);
		}
	}, [cyx === undefined, router]);

	return (
		<div className={styles.browser}>
			{map}
			<div className={styles.hudArea}>
				<div className={styles.hud}>
					<div className={styles.searchArea}>
						<SearchBar
							selected={(selected: string) => setMapSelected(selected)}
							hovered={(hovered: string) => setMapHovered(hovered)}
							dehovered={(dehovered: string) => setMapDehovered(dehovered)}
						/>
					</div>
					{creatingIdea && (
						<div className={styles.hudModal}>
							<NewIdeaModal
								active={creatingIdea}
								onClose={() => setCreatingIdea(false)}
								onUpload={async (data) =>
									(
										await ipfs.add(new Uint8Array(serialize(data)))
									).cid.toString()
								}
								onDeploy={() => setCreatingIdea(false)}
								ctx={[web3, eth]}
							/>
						</div>
					)}
					{modal !== undefined && (
						<div className={styles.hudModal}>{modal}</div>
					)}
					<div className={styles.leftActionButton}>
						<div className={styles.zoomButtons}>
							<div
								className={styles.zoomButton}
								onClick={() => setMapZoom(1.4)}
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
						<FilledButton
							label="New Idea"
							onClick={() => setCreatingIdea(true)}
						/>
					</div>
					{activeIdea !== undefined && (
						<div className={styles.ideaDetailsPanel}>
							<IdeaDetailCard
								content={activeIdea}
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
