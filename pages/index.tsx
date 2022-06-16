import { useParents, loadExtendedIdeaInfo } from "../lib/util/ipfs";
import { useOwnedIdeas, useTraversedChildIdeas, ModelTypes } from "../lib/util/discovery";
import { useWeb3 } from "../lib/util/web3";
import { IpfsContext } from "../lib/util/ipfs";
import { ModalContext } from "../lib/util/modal";
import { serialize } from "bson";
import { useViewerConnection as useConnection, useViewerRecord } from "@self.id/framework";
import { useState, useEffect, useContext } from "react";
import { useConnStatus } from "../lib/util/networks";
import { BasicIdeaInformation } from "../components/workspace/IdeaBubble";
import { IdeaDetailCard } from "../components/workspace/IdeaDetailCard";
import { NewIdeaModal } from "../components/status/NewIdeaModal";
import { FilledButton } from "../components/status/FilledButton";
import { IdeaMap } from "../components/workspace/IdeaMap";
import { SearchBar } from "../components/workspace/SearchBar";
import styles from "./index.module.css";

/**
 * Ideas deployed by Vision eco for different networks.
 * Bootstraps for subsequent children.
 */
export const staticIdeas: Map<string, string[]> = new Map([
	["ethereum", [] as string[]],
	["polygon", [] as string[]],
	["polygon-test", [
		"0x3e515F4C2dfdc0506Fc7174e21aEb68B05561f48",
	]],
]);

/**
 * Every 5 seconds, remind other users that this root idea exists.
 */
const heartbeatPeriod = 5000;

/**
 * A known instance of the vision Idea contract against which bytecodes are
 * compared to determine parenthood.
 *
 * TODO: This does not work for mainnet at the moment
 */
export const baseIdeaContract = staticIdeas.get("polygon-test")[0];

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
	const [modal, ] = useContext(ModalContext);
	const [conn, ,] = useConnection();
	const [connStatus, ] = useConnStatus();

	// Ideas are discovered through other peers informing us of them, through
	// locally existing ones (e.g., that were created on vision.eco),
	// and through entries in the registry smart contract.
	const [rootIdeas, pubRootIdea] = useParents(staticIdeas);
	const userIdeasRecord = useViewerRecord<ModelTypes>("visionOwnedItemAddressesList");
	const ownedIdeas = useOwnedIdeas(conn.status == "connected" ? conn.selfID.id : "", web3, baseIdeaContract);

	// Ideas can either be known through immediate information (i.e., stored on
	// the device, hardcoded, or received over the network, or through work done
	// on our own to traverse the graph)
	const immediateIdeas = [...rootIdeas, ...ownedIdeas];
	const discoveredIdeas = useTraversedChildIdeas(immediateIdeas.sort(), web3, ipfs, []);

	// Record edges for all ideas that have them, or default to a list of empty edges
	const allIdeas = [...immediateIdeas].reduce((ideas, ideaAddr) => { return { ...ideas, [ideaAddr]: discoveredIdeas[ideaAddr] ?? {} }; }, {});

	// Display items as a map of bubbles
	const [creatingIdea, setCreatingIdea] = useState(false);

	const loadIdeaCard = async (details: BasicIdeaInformation) => {
		setActiveIdea(null);

		const info = await loadExtendedIdeaInfo(ipfs, connStatus.network, web3, details);
		setActiveIdea(info);
	};

	useEffect(() => {
		// Set gossip providers for all of the user's self-hosted ideas
		const gossipers = [];

		for (const ideaAddr of ownedIdeas) {
			// Remind other users every n seconds about our sovereign ideas,
			// and register a PID to cancel after the component is dismounted
			gossipers.push(setInterval(() => {
				pubRootIdea(ideaAddr);
			}, heartbeatPeriod));
		}

		// Remove all pubsub publishers after the item is dismounted
		return () => {
			for (const gossiper of gossipers) {
				clearInterval(gossiper);
			}
		};
	});

	const [setMapSelected, setMapZoom, map] = IdeaMap({ ideas: allIdeas, onClickIdea: (idea) => loadIdeaCard(idea)  });
	return (
		<div className={ styles.browser }>
			{ map }
			<div className={ styles.hudArea }>
				<div className={ styles.hud }>
					<div className={ styles.searchArea }>
						<SearchBar />
					</div>
					{ creatingIdea &&
						<div className={ styles.hudModal }>
							<NewIdeaModal
								active={ creatingIdea }
								onClose={ () => setCreatingIdea(false) }
								onUpload={ async (data) => (await ipfs.add(new Uint8Array(serialize(data)))).cid.toString() }
								onDeploy={ () => setCreatingIdea(false) }
								ctx={ [web3, eth] }
								ideasBuf={ userIdeasRecord }
							/>
						</div>
					}
					{
						modal !== undefined &&
							<div className={ styles.hudModal }>
								{ modal }
							</div>
					}
					<div className={ styles.leftActionButton }>
						<div className={ styles.zoomButtons }>
							<div className={ styles.zoomButton } onClick={ () => setMapZoom(1.4) }>
								+
							</div>
							<div className={ styles.zoomButton } onClick={ () => setMapZoom(0.9) }>
								-
							</div>
						</div>
						<FilledButton label="New Idea" onClick={ () => setCreatingIdea(true) }/>
					</div>
					{ activeIdea !== undefined &&
						<div className={ styles.ideaDetailsPanel }>
							<IdeaDetailCard content={ activeIdea } onClose={ () => { setActiveIdea(undefined); setMapSelected(undefined); } } />
						</div>
					}
				</div>
			</div>
		</div>
	);
};

export default Index;
