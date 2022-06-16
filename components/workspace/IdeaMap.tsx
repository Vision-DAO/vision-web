import styles from "./IdeaMap.module.css";
import { BasicIdeaInformation } from "./IdeaBubble";
import { FundingRate, loadBasicIdeaInfo, IpfsContext } from "../../lib/util/ipfs";
import { useWeb3 } from "../../lib/util/web3";
import { isIdeaContract } from "../../lib/util/discovery";
import Idea from "../../value-tree/build/contracts/Idea.json";
import { baseIdeaContract } from "../../pages/index";

import { useRef, useState, useEffect, Dispatch, SetStateAction, ReactElement, useContext } from "react";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";

/**
 * Props for which ideas to render, and each of the ideas' children, and for
 * running callbacks when:
 * - A user clicks an idea on the map
 */
export interface IdeaMapProps {
	ideas: { [idea: string]: FundingRate[] },

	onClickIdea: (idea: BasicIdeaInformation) => void,
}

const blockIdea = (ideaAddr: string, dispatch: Dispatch<SetStateAction<Set<string>>>) => dispatch(ideas => { return new Set([...ideas, ideaAddr]); });

/**
 * Displays a cytoscape map rendering Idea Bubbles for all of the ideas
 * whose addresses exist in `ideas`, and returns a hook for setting the map's
 * active idea, and setting the zoom level.
 */
export const IdeaMap = ({ ideas, onClickIdea }: IdeaMapProps): [(ideaAddr: string) => void, (zoom: number) => void, ReactElement] => {
	const [web3, ] = useWeb3();
	const ipfs = useContext(IpfsContext);

	// The container that cytoscape binds to for rendering nodes
	const map = useRef(null);

	// States for loading ideas
	const [blockedIdeas, setBlockedIdeas] = useState<Set<string>>(new Set());
	const [ideaDetails, setIdeaDetails] = useState<{[ideaAddr: string]: BasicIdeaInformation}>({});

	// For detecting whether ideas are valid
	const [ideaContractBytecode, setIdeaContractBytecode] = useState(null);

	// The cytoscape instance used for the map
	const [cyx, setCy] = useState(undefined);
	const [cyNodes, setCyNodes] = useState<Set<string>>(new Set());

	const handleClick = (e: cytoscape.EventObjectNode) => onClickIdea(ideaDetails[e.target.id()]);

	// Every time the list of parent nodes expands, part of the component
	// tree must be rebuilt
	useEffect(() => {
		// Load an instance of the idea contract bytecode
		if (ideaContractBytecode == null && web3) {
			setIdeaContractBytecode("");

			web3.eth.getCode(baseIdeaContract)
				.then((code) => setIdeaContractBytecode(code));
		}

		if (cyx)
			cyx.startBatch();

		for (const ideaAddr of Object.keys(ideas)) {
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
					if (cyx) {

						// Mutate the existing record
						if (cyNodes.has(ideaAddr)) {
							const node = cyx.getElementById(ideaAddr);
							node.data("label", bubbleContent.title);

							if (bubbleContent.image)
								node.data("image", bubbleContent.image);

							return;
						}

						// Add the new idea to the cytoscape instance
						const newNode = { group: "nodes", data: { id: ideaAddr, label: bubbleContent.title, ...(bubbleContent.image ? { image: bubbleContent.image } : {}) } };
						cyx.add(newNode);
						cyx.layout({ name: "cola" }).run();

						setCyNodes(nodes => new Set([...nodes, ideaAddr]));
					}

					setIdeaDetails(ideas => { return {...ideas, [ideaAddr]: bubbleContent}; });
				}
			})();
		}

		if (cyx)
			cyx.endBatch();
	});

	// Render a map of ideas
	useEffect(() => {
		let destructor = Function.prototype();

		if (map && map.current) {
			let cy = cyx;

			if (cyx === undefined) {
				setCy(null);

				cytoscape.use(cola);

				cy = cytoscape({
					container: map.current,
					wheelSensitivity: 0.25,
					elements: {
						nodes: [],
						edges: [],
					},
					zoom: 0.8,
					layout: {
						name: "cola",
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
							},
						},
						{
							selector: "node[image]",
							style: {
								"background-image": "data(image)",
								"background-image-containment": "over",
								"background-fit": "cover",
								"background-image-opacity": 0.6,
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

				window.cyx = cy;

				setCy(cy);
			}

			if (!cy)
				return;

			const newEdges = Object.entries(ideas).map(([k, v]) => Object.values(v).filter((edge) => edge.sender in ideaDetails && k in ideaDetails).map((edge) => { return { data: { id: `${k}${edge.sender}`, source: edge.sender, target: k } }; })).flat().filter(({ data: { id } }) => !cyNodes.has(id));

			cy.add(newEdges.map((edge) => { return { group: "edges", ...edge }; }));

			if (newEdges.length > 0)
				setCyNodes(nodes => new Set([...nodes, ...newEdges.map(({ data: { id } }) => id)]));

			// When the user puts their mouse over a node
			const handleHover = (e: cytoscape.EventObjectNode) => {
				if (e.cy.container()) {
					e.cy.container().style.cursor = "pointer";
				}

				// Save to return to original height
				const sizePx = e.target.style("height").split("px")[0];
				e.target.data("originalSize", sizePx);

				const fontSizePx = e.target.style("font-size").split("px")[0];
				e.target.data("originalFontSize", fontSizePx);

				e.target.animate({
					style: {
						height: `${sizePx * 1.05}px`,
						width: `${sizePx * 1.05}px`,
						"font-size": `${fontSizePx * 1.05}px`,
						opacity: 0.8,
					},
				},
				{
					duration: 100,
					easing: "ease-in-out",
				});
			};

			const handleDehover = (e: cytoscape.EventObjectNode) => {
				if (e.cy.container())
					e.cy.container().style.cursor = "default";

				e.target.animate({
					style: {
						height: `${e.target.data("originalSize")}px`,
						width: `${e.target.data("originalSize")}px`,
						"font-size": `${e.target.data("originalFontSize")}px`,
						opacity: 1,
					},
				},
				{
					duration: 100,
					easing: "ease-in-out",
				});
			};

			cy.on("select", "node", handleClick);
			cy.on("mouseover", "node", handleHover);
			cy.on("mouseout", "node", handleDehover);

			destructor = () => {
				cy.removeListener("select", handleClick);
				cy.removeListener("mouseover", handleHover);
				cy.removeListener("mouseout", "node", handleDehover);
			};
		}

		return destructor;
	});

	return [(addr) => { cyx.nodes().unselect(); if (addr) cyx.getElementById(addr).select();}, (zoom) => cyx.zoom({ level: cyx.zoom() * zoom, renderedPosition: { x: cyx.width() / 2, y: cyx.height() / 2 }}), (
		<div key="map" className={ styles.mapContainer } ref={ map }>
		</div>
	)];
};
