import styles from "./IdeaMap.module.css";
import { BasicIdeaInformation } from "./IdeaBubble";
import {
	loadIdeaImageSrc,
	IpfsContext,
	IpfsStoreContext,
} from "../../lib/util/ipfs";
import { GetMapItemsQuery } from "../../.graphclient";

import {
	useRef,
	useState,
	useEffect,
	Dispatch,
	SetStateAction,
	ReactElement,
	useContext,
} from "react";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";

/**
 * Props for which ideas to render, and each of the ideas' children, and for
 * running callbacks when:
 * - A user clicks an idea on the map
 */
export interface IdeaMapProps {
	ideas: GetMapItemsQuery;

	onClickIdea: (idea: string) => void;
}

const blockIdea = (
	ideaAddr: string,
	dispatch: Dispatch<SetStateAction<Set<string>>>
) =>
	dispatch((ideas) => {
		return new Set([...ideas, ideaAddr]);
	});

/**
 * Displays a cytoscape map rendering Idea Bubbles for all of the ideas
 * whose addresses exist in `ideas`, and returns a hook for setting the map's
 * active idea, and setting the zoom level.
 */
export const IdeaMap = ({
	ideas,
	onClickIdea,
}: IdeaMapProps): [
	Set<string> | undefined,
	(ideaAddr: string) => void,
	(ideaAddr: string) => void,
	(ideaAddr: string) => void,
	(zoom: number) => void,
	ReactElement
] => {
	const ipfs = useContext(IpfsContext);

	// IPFS CID's that have already been seen
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);

	// The container that cytoscape binds to for rendering nodes
	const map = useRef(null);

	// Used for detecting which addresses are valid vision entities
	const ideaAddrs = new Set(ideas.ideas.map((idea) => idea.id));

	// States for loading ideas
	const [blockedIdeas, setBlockedIdeas] = useState<Set<string>>(new Set());

	// The cytoscape instance used for the map
	const [cyx, setCy] = useState(undefined);
	const [cyNodes, setCyNodes] = useState<Set<string>>(new Set());

	const handleClick = (e: cytoscape.EventObjectNode) =>
		onClickIdea(e.target.id());

	// Every time the list of parent nodes expands, part of the component
	// tree must be rebuilt
	useEffect(() => {
		for (const idea of ideas.ideas) {
			// Skip all ideas that have been blocked
			if (blockedIdeas.has(idea.id)) continue;

			// Fetch the basic information of the idea from Ethereum
			(async () => {
				// All ideas must have some metadata stored on IPFS
				const ipfsAddr = idea.ipfsAddr;

				if (!ipfsAddr) {
					blockIdea(idea.id, setBlockedIdeas);

					return;
				}

				// Load the image of the blob if it hasn't already been loaded
				let imgBlob: string;

				if (
					!(idea.ipfsAddr in ipfsCache) ||
					!("icon" in ipfsCache[idea.ipfsAddr])
				) {
					// Make the image of the blob as loading, and then update it
					setIpfsCache(idea.ipfsAddr, "icon", null);
					imgBlob = await loadIdeaImageSrc(ipfs, idea.ipfsAddr);
					setIpfsCache(idea.ipfsAddr, "icon", imgBlob);
				} else {
					imgBlob = ipfsCache[idea.ipfsAddr]["icon"] as string;
				}

				// Load the image attached to the idea
				const bubbleContent: BasicIdeaInformation = {
					title: idea.name,
					addr: idea.id,
					image: imgBlob === null ? undefined : imgBlob,
				};

				// Render the information of the bubble as a component on the mindmap
				if (cyx) {
					// Mutate the existing record
					if (cyNodes.has(idea.id)) {
						const node = cyx.getElementById(idea.id);
						node.data("label", bubbleContent.title);

						if (bubbleContent.image) node.data("image", bubbleContent.image);

						return;
					}

					setCyNodes((nodes) => new Set([...nodes, idea.id]));

					// Add the new idea to the cytoscape instance
					const newNode = {
						group: "nodes",
						data: {
							id: idea.id,
							label: bubbleContent.title,
							...(bubbleContent.image ? { image: bubbleContent.image } : {}),
						},
					};
					cyx.add(newNode);
					cyx.layout({ name: "cola" }).run();
				}
			})();
		}
	}, [ideas.ideas.length]);

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
								label: "data(label)",
								"text-wrap": "ellipsis",
								"text-max-width": "70%",
								"text-valign": "center",
								color: "white",
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
								width: 0.1,
								opacity: 0.75,
							},
						},
					],
				});

				setCy(cy);
			}

			if (!cy) return;

			const newEdges = ideas.props
				.filter(
					({ funder, toFund }) =>
						ideaAddrs.has(funder.id) &&
						ideaAddrs.has(toFund) &&
						cyNodes.has(funder.id) &&
						cyNodes.has(toFund)
				)
				.map(({ funder, toFund }) => {
					return {
						data: {
							id: `${toFund}${funder}`,
							source: funder.id,
							target: toFund,
						},
					};
				})
				.flat()
				.filter(({ data: { id } }) => !cyNodes.has(id));

			cy.add(
				newEdges.map((edge) => {
					return { group: "edges", ...edge };
				})
			);

			if (newEdges.length > 0)
				setCyNodes(
					(nodes) =>
						new Set([...nodes, ...newEdges.map(({ data: { id } }) => id)])
				);

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

				e.target.animate(
					{
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
					}
				);
			};

			const handleDehover = (e: cytoscape.EventObjectNode) => {
				if (e.cy.container()) e.cy.container().style.cursor = "default";

				e.target.animate(
					{
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
					}
				);
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

	return [
		cyx !== undefined ? cyNodes : undefined,
		(addr) => {
			cyx.nodes().unselect();
			if (addr) cyx.getElementById(addr).select();
		},
		(addr) => {
			cyx.getElementById(addr).trigger("mouseover");
		},
		(addr) => {
			cyx.getElementById(addr).trigger("mouseout");
		},
		(zoom) =>
			cyx.zoom({
				level: cyx.zoom() * zoom,
				renderedPosition: { x: cyx.width() / 2, y: cyx.height() / 2 },
			}),
		<div key="map" className={styles.mapContainer} ref={map}></div>,
	];
};
