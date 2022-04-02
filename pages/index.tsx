import { useParents } from "../lib/util/ipfs";
import { useOwnedIdeas } from "../lib/util/discovery";
import { useWeb3 } from "../lib/util/web3";
import { useState, useEffect } from "react";
import Idea from "../value-tree/build/contracts/Idea.json";
import { IdeaBubble, IdeaBubbleProps } from "../components/workspace/IdeaBubble";
import { NewIdeaModal, NewIdeaSubmission } from "../components/status/NewIdeaModal";
import { FilledButton } from "../components/status/FilledButton";
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
	const [ideaDetails, setIdeaDetails] = useState({});
	const [web3, eth] = useWeb3();

	// Display items as a map of bubbles
	const [zoomFactor, setZoomFactor] = useState(1);
	const [creatingIdea, setCreatingIdea] = useState(false);

	// Every time the list of parent nodes expands, part of the component
	// tree must be rebuilt
	useEffect(() => {
		for (const ideaAddr of rootIdeas) {
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

					size: zoomFactor,
				};

				// Shallow comparison to check that the bubble info has already been cached
				const bubblesEqual = (a: IdeaBubbleProps, b: IdeaBubbleProps): boolean => {
					if (!a || !b)
						return false;

					for (const key of Object.keys(a)) {
						if (a[key] != b[key])
							return false;
					}

					return true;
				};

				// Render the information of the bubble as a component on the mindmap
				if (!bubblesEqual(ideaDetails[ideaAddr], bubble))
					setIdeaDetails({...ideaDetails, [ideaAddr]: bubble});
			})();
		}
	});

	// The size of idea bubbles might change before the information in them does, or is loaded in
	const ideaBubbles = Object.values(ideaDetails)
		.map((props: IdeaBubbleProps) => IdeaBubble({ ...props, size: zoomFactor }));

	return (
		<div className={ styles.browser }>
			<div className={ styles.map }>
				{ ideaBubbles }
			</div>
			<div className={ styles.hud }>
				<div className={ styles.hudModal }>
					<NewIdeaModal active={ creatingIdea } onClose={ () => setCreatingIdea(false) } onDeploy={ (addr) => alert(addr) } ctx={ [web3, eth] } />
				</div>
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
			</div>
		</div>
	);
};

export default Index;
