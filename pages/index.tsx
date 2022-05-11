import { useParents, loadExtendedIdeaInfo, loadBasicIdeaInfo } from "../lib/util/ipfs";
import { useOwnedIdeas, isIdeaContract } from "../lib/util/discovery";
import { useWeb3 } from "../lib/util/web3";
import { IpfsContext } from "../lib/util/ipfs";
import { ModalContext } from "../lib/util/modal";
import { serialize } from "bson";
import { useConnection, useViewerRecord } from "@self.id/framework";
import { useState, useEffect, useContext, Dispatch, SetStateAction } from "react";
import { useConnStatus } from "../lib/util/networks";
import Idea from "../value-tree/build/contracts/Idea.json";
import { IdeaBubble, BasicIdeaInformation } from "../components/workspace/IdeaBubble";
import { IdeaDetailCard } from "../components/workspace/IdeaDetailCard";
import { NewIdeaModal } from "../components/status/NewIdeaModal";
import { FilledButton } from "../components/status/FilledButton";
import styles from "./index.module.css";

/**
 * Ideas deployed by Vision eco for different networks.
 * Bootstraps for subsequent children.
 */
export const staticIdeas: Map<string, string[]> = new Map([
	["ethereum", [] as string[]],
	["polygon", [] as string[]],
	["polygon-test", [
		"0x2Bc839ce334D3dE78eF8E6929ad484756B842293",
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
const baseIdeaContract = staticIdeas.get("polygon-test")[0];

const blockIdea = (ideaAddr: string, dispatch: Dispatch<SetStateAction<Set<string>>>) => dispatch(ideas => { return new Set([...ideas, ideaAddr]); });

/**
 * A navigable page rendering a mind map of ideas minted on vision.
 */
export const Index = () => {
	// The IPFS context should always be available since we are inside the
	// networked UI context. Render the list of parents from this context,
	// and update it later if need be
	const [ideaDetails, setIdeaDetails] = useState<{[ideaAddr: string]: BasicIdeaInformation}>({});
	const [activeIdea, setActiveIdea] = useState(undefined);
	const [blockedIdeas, setBlockedIdeas] = useState<Set<string>>(new Set());
	const [ipfsCache, setIpfsCache] = useState({});
	const [web3, eth] = useWeb3();
	const ipfs = useContext(IpfsContext);
	const [modal, ] = useContext(ModalContext);
	const [conn, ,] = useConnection();
	const [connStatus, ] = useConnStatus();

	// Ideas are discovered through other peers informing us of them, through
	// locally existing ones (e.g., that were created on vision.eco),
	// and through entries in the registry smart contract.
	const [rootIdeas, pubRootIdea] = useParents(staticIdeas);
	const userIdeasRecord = useViewerRecord("cryptoAccounts");
	const ownedIdeas = useOwnedIdeas(conn.status == "connected" ? conn.selfID.id : "", web3, baseIdeaContract);
	const allIdeas = [...rootIdeas, ...ownedIdeas];
	const [ideaContractBytecode, setIdeaContractBytecode] = useState(null);

	// Display items as a map of bubbles
	const [zoomFactor, setZoomFactor] = useState(1);
	const [creatingIdea, setCreatingIdea] = useState(false);

	// Every time the list of parent nodes expands, part of the component
	// tree must be rebuilt
	useEffect(() => {
		// Load an instance of the idea contract bytecode
		if (ideaContractBytecode == null && web3) {
			setIdeaContractBytecode("");

			web3.eth.getCode(baseIdeaContract)
				.then((code) => setIdeaContractBytecode(code));
		}

		// Set gossip providers for all of the user's self-hosted ideas
		const gossipers = [];

		for (const ideaAddr of ownedIdeas) {
			// Remind other users every n seconds about our sovereign ideas,
			// and register a PID to cancel after the component is dismounted
			gossipers.push(setTimeout(() => {
				pubRootIdea(ideaAddr);
			}, heartbeatPeriod));
		}

		for (const ideaAddr of allIdeas) {
			const contract = new web3.eth.Contract(Idea.abi, ideaAddr);

			// Skip all ideas that have been blocked
			if (blockedIdeas.has(ideaAddr))
				continue;

			// We cannot check that the given contract is an Idea without
			// an instance of the Idea contract to compare to
			if (!ideaContractBytecode || ideaContractBytecode == "")
				break;

			// Mark the item as being loaded
			if (!(ideaAddr in ideaDetails)) {
				setIdeaDetails(ideas => { return { ...ideas, [ideaAddr]: null }; } );
			}

			// Fetch the basic information of the idea from Ethereum
			// TODO: Loading of extended metadata from IPFS
			(async () => {
				// Filter out any contracts that aren't ideas
				// TODO: Cover Proposals as well
				if (!(ideaAddr in ideaDetails) && !await isIdeaContract(web3, ideaAddr, ideaContractBytecode)) {
					blockIdea(ideaAddr, setBlockedIdeas);

					return;
				}

				// All ideas must have some metadata stored on IPFS
				const ipfsAddr = await contract.methods.ipfsAddr().call();
				
				if (!ipfsAddr) {
					blockIdea(ideaAddr, setBlockedIdeas);

					return;
				}

				// TODO: Allow live updates for basic idea metadata once it is feasible
				if (ideaAddr in ideaDetails)
					return;

				// See IdeaBubble.tsx for prop documentation
				let bubbleContent: BasicIdeaInformation = ipfsCache[ipfsAddr];

				// Extra props containing optional data for a bubble
				// All ideas have associated metadata of varying degrees of completion
				if (!(ipfsAddr in ipfsCache)) {
					// Mark the item as being loaded
					setIpfsCache(cache => { return { ...cache, [ipfsAddr]: null }; });

					// Load the title, image, and address of the idea
					const data = await loadBasicIdeaInfo(ipfs, web3, ideaAddr);

					// Make sure no errors occurred
					if (!data) {
						// Remove the idea from the list of viewable ideas
						blockIdea(ideaAddr, setBlockedIdeas);

						if (ideaAddr in ideaDetails) {
							setIdeaDetails(ideas => { const { [ideaAddr]: _, ...remaining } = ideas; return remaining; });
						}

						return;
					}

					// Cache the content
					setIpfsCache(cache => { return { ...cache, [ipfsAddr]: data }; });

					bubbleContent = data;
				}

				// This item is still loading
				if (!bubbleContent)
					return;

				// Shallow comparison to check that the bubble info has already been cached
				const bubblesEqual = (a: BasicIdeaInformation, b: BasicIdeaInformation): boolean => {
					if (!a || !b)
						return false;

					for (const key of Object.keys(a)) {
						if (a[key] != b[key])
							return false;
					}

					return true;
				};

				// Render the information of the bubble as a component on the mindmap
				if (!bubblesEqual(ideaDetails[ideaAddr], bubbleContent)) {
					setIdeaDetails(ideas => { return {...ideas, [ideaAddr]: bubbleContent}; });
				}
			})();
		}

		// Remove all pubsub publishers after the item is dismounted
		return () => {
			for (const gossiper of gossipers) {
				clearTimeout(gossiper);
			}
		};
	});

	console.log(ideaDetails);

	const loadIdeaCard = async (details: BasicIdeaInformation) => {
		setActiveIdea(null);

		const info = await loadExtendedIdeaInfo(ipfs, connStatus.network, web3, details);
		setActiveIdea(info);
	};

	// The size of idea bubbles might change before the information in them does, or is loaded in
	const ideaBubbles = Object.values(ideaDetails)
		.filter((details) => details !== null)
		.map((details: BasicIdeaInformation) =>
			IdeaBubble({
				details: details,
				size: zoomFactor,
				active: activeIdea && activeIdea.addr == details.addr,
				onClick: () => loadIdeaCard(details),
			}));

	return (
		<div className={ styles.browser }>
			<div className={ styles.map }>
				{ ideaBubbles }
			</div>
			<div className={ styles.hud }>
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
						<div className={ styles.zoomButton } onClick={ () => setZoomFactor(zoomFactor * 1.1) }>
							+
						</div>
						<div className={ styles.zoomButton } onClick={ () => setZoomFactor(zoomFactor * 0.9) }>
							-
						</div>
					</div>
					<FilledButton label="New Idea" onClick={ () => setCreatingIdea(true) }/>
				</div>
				{ activeIdea !== undefined &&
					<div className={ styles.ideaDetailsPanel }>
						<IdeaDetailCard content={ activeIdea } onClose={ () => setActiveIdea(undefined) } />
					</div>
				}
			</div>
		</div>
	);
};

export default Index;
