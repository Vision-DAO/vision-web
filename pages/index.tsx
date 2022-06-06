import { useParents, loadExtendedIdeaInfo, loadBasicIdeaInfo } from "../lib/util/ipfs";
import { useOwnedIdeas, isIdeaContract, useTraversedChildIdeas } from "../lib/util/discovery";
import { useWeb3 } from "../lib/util/web3";
import { IpfsContext } from "../lib/util/ipfs";
import { ModalContext } from "../lib/util/modal";
import { serialize } from "bson";
import { useConnection, useViewerRecord } from "@self.id/framework";
import { useState, useEffect, useContext, Dispatch, SetStateAction, useRef, Fragment, createElement } from "react";
import { useConnStatus } from "../lib/util/networks";
import Idea from "../value-tree/build/contracts/Idea.json";
import { BasicIdeaInformation } from "../components/workspace/IdeaBubble";
import dagre from "cytoscape-dagre";
import { IdeaDetailCard } from "../components/workspace/IdeaDetailCard";
import { NewIdeaModal } from "../components/status/NewIdeaModal";
import { FilledButton } from "../components/status/FilledButton";
import cytoscape from "cytoscape";
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
	const [ideaContractBytecode, setIdeaContractBytecode] = useState(null);

	// Ideas can either be known through immediate information (i.e., stored on
	// the device, hardcoded, or received over the network, or through work done
	// on our own to traverse the graph)
	const immediateIdeas = [...rootIdeas, ...ownedIdeas];
	const discoveredIdeas = useTraversedChildIdeas(immediateIdeas.sort(), web3, ipfs, []);

	// Record edges for all ideas that have them, or default to a list of empty edges
	const allIdeas = [...immediateIdeas].reduce((ideas, ideaAddr) => { return { ...ideas, [ideaAddr]: discoveredIdeas[ideaAddr] ?? {} }; }, {});

	// Display items as a map of bubbles
	const [zoomFactor, setZoomFactor] = useState(1);
	const [creatingIdea, setCreatingIdea] = useState(false);

	// The container that cytoscape binds to for rendering nodes
	const map = useRef(null);

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
			gossipers.push(setInterval(() => {
				pubRootIdea(ideaAddr);
			}, heartbeatPeriod));
		}

		for (const ideaAddr of Object.keys(allIdeas)) {
			// Cannot continue without an exemplar to compare against
			if (!ideaContractBytecode || ideaContractBytecode == "")
				break;

			// Skip all ideas that have been blocked
			if (blockedIdeas.has(ideaAddr))
				continue;

			// TODO: Allow live updates for basic idea metadata once it is feasible
			if (ideaAddr in ideaDetails)
				continue;

			const contract = new web3.eth.Contract(Idea.abi, ideaAddr);

			// Mark the item as being loaded
			setIdeaDetails(ideas => { return { ...ideas, [ideaAddr]: null }; } );

			// Fetch the basic information of the idea from Ethereum
			// TODO: Loading of extended metadata from IPFS
			(async () => {
				// Filter out any contracts that aren't ideas
				// TODO: Cover Proposals as well
				if (!await isIdeaContract(web3, ideaAddr, ideaContractBytecode)) {
					blockIdea(ideaAddr, setBlockedIdeas);

					return;
				}

				// All ideas must have some metadata stored on IPFS
				const ipfsAddr = await contract.methods.ipfsAddr().call();
				
				if (!ipfsAddr) {
					blockIdea(ideaAddr, setBlockedIdeas);

					return;
				}

				// Extra props containing optional data for a bubble
				// All ideas have associated metadata of varying degrees of completion
				// Load the title, image, and address of the idea
				const data = await loadBasicIdeaInfo(ipfs, web3, ideaAddr);

				// Make sure no errors occurred
				if (!data) {
					// Remove the idea from the list of viewable ideas
					blockIdea(ideaAddr, setBlockedIdeas);

					return;
				}

				const bubbleContent: BasicIdeaInformation = data;

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
				clearInterval(gossiper);
			}
		};
	});

	const loadIdeaCard = async (details: BasicIdeaInformation) => {
		setActiveIdea(null);

		const info = await loadExtendedIdeaInfo(ipfs, connStatus.network, web3, details);
		setActiveIdea(info);
	};

	// Render a map of ideas
	useEffect(() => {
		cytoscape.use(dagre);

		let destructor = () => {};

		if (map && map.current) {
			const cy = cytoscape({
				container: map.current,
				elements: {
					nodes: Object.entries(ideaDetails).map(([k, v]) => { return { data: { id: k, label: v ? v.title : k } }; }),
					edges: Object.entries(discoveredIdeas).map(([k, v]) => Object.values(v).filter((edge) => edge.sender in ideaDetails && k in ideaDetails).map((edge) => { return { data: { id: `${k}${edge.sender}`, source: edge.sender, target: k } }; })).flat(),
				},
				zoom: 0.8,
				layout: {
					name: "dagre",
				},
				boxSelectionEnabled: false,
				style: [
					{
						selector: "node",
						style: {
							"label": "data(label)",
							"text-wrap": "ellipsis",
							"text-max-width": "70%",
							"text-valign": "center",
							"color": "white",
							"font-size": "2.75rem",
							"font-family": "Roboto, Helvetica Neue, sans-serif",
							"font-weight": "bold",
							"background-color": "#151515",
							"border-width": 0.05,
							"border-color": "white",
							"background-image": "data(image)",
						},
					},
					{
						selector: "node:selected",
						style: {
							"border-width": 0.25,
							"border-color": "#5D5FEF",
						},
					},
					{
						selector: "node:active",
						style: {
							"border-width": 0.25,
						},
					},
					{
						selector: "edge",
						style: {
							"width": 0.1,
							"opacity": 0.75,
						}
					},
				],
			});

			// Open the idea card for the node whenever it is tapped
			const handleClick = (e) => {
				loadIdeaCard(ideaDetails[e.target.id()]);
				cy.nodes().unselect();
				e.target.select();
			};

			cy.on("tap", "node", handleClick);

			destructor = () => {
				cy.removeListener("tap", handleClick);
			};
		}

		return destructor;
	});

	return (
		<div className={ styles.browser }>
			<div className={ styles.mapContainer } ref={ map }>
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
