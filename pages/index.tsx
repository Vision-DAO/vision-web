import { useParents } from "../lib/util/ipfs";
import { useWeb3 } from "../lib/util/web3";
import { useState, useEffect } from "react";
import Idea from "../value-tree/build/contracts/Idea.json";
import { IdeaBubble } from "../components/workspace/IdeaBubble";
import styles from "./index.module.css";

/**
 * Ideas deployed by Vision eco for different networks.
 * Bootstraps for subsequent children.
 */
const staticIdeas: Map<string, string[]> = new Map([
	["ethereum", [] as string[]],
	["polygon", [] as string[]],
	["polygon-test", [
		"0x1C8bc5837c3d450f7B5f4087bD6b36F4b92fd846",
	]],
]);

/**
 * A navigable page rendering a mind map of ideas minted on vision.
 */
export const Index = () => {
	// The IPFS context should always be available since we are inside the
	// networked UI context. Render the list of parents from this context,
	// and update it later if need be
	const [rootIdeas, pubRootIdea] = useParents(staticIdeas);
	const [rendered, setRendered] = useState<Set<string>>(new Set());
	const [ideaBubbles, setIdeaBubbles] = useState([]);
	const [web3, ] = useWeb3();

	// Every time the list of parent nodes expands, part of the component
	// tree must be rebuilt
	useEffect(() => {
		for (const ideaAddr of rootIdeas) {
			if (rendered.has(ideaAddr)) {
				continue;
			}

			// Prevent a reload of this idea
			setRendered(new Set([...rendered, ideaAddr]));

			const contract = new web3.eth.Contract(Idea.abi, ideaAddr);

			// Fetch the basic information of the idea from Ethereum
			// TODO: Loading of extended metadata from IPFS
			(async () => {
				const bubble = {
					title: await contract.methods.name().call(),
					ticker: await contract.methods.symbol().call(),
					totalSupply: await contract.methods.totalSupply().call(),

					// TODO: Read these from IPFS
					image: null,
					description: "",

					addr: ideaAddr,
				};

				// Render the information of the bubble as a component on the mindmap
				setIdeaBubbles([...ideaBubbles, IdeaBubble(bubble)]);
			})();
		}
	});

	return (
		<div className={ styles.browser }>
			<div>
				{ ideaBubbles }
			</div>
			<div className={ styles.hud }>
			</div>
		</div>
	);
};

export default Index;
