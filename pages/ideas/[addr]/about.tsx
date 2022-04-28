import { ReactElement, useContext } from "react";
import { IdeaDetailNavigatorLayout } from "../../../components/workspace/IdeaDetailNavigatorLayout";
import { IdeaInfoPanel } from "../../../components/workspace/idea/IdeaInfoPanel";
import { IdeaVisualInfoWindow } from "../../../components/workspace/idea/IdeaVisualInfoWindow";
import { IdeaActivityPanel } from "../../../components/workspace/idea/IdeaActivityPanel";
import { ExtendedIdeaInformation } from "../../../components/workspace/IdeaDetailCard";
import { ActiveIdeaContext } from "../../../lib/util/ipfs";
import { useWeb3 } from "../../../lib/util/web3";
import styles from "./about.module.css";

/**
 * A sub-navigation context that allows a user to view basic information about
 * an idea, a list of proposals about the idea, a discussion board, and
 * market metrics about the idea.
 */
export const About = () => {
	// See NavigatorLayout container. This will never be NULL
	const [idea, ]: [ExtendedIdeaInformation, unknown] = useContext(ActiveIdeaContext);
	const [web3, ] = useWeb3();

	return (
		<div className={ styles.infoContainers }>
			<div className={ styles.splitPanel }>
				<IdeaInfoPanel idea={ idea } />
				<IdeaVisualInfoWindow idea={ idea } />
			</div>
			<IdeaActivityPanel web3={ web3 } idea={ idea } />
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
About.getLayout = (page: ReactElement) => <IdeaDetailNavigatorLayout>{ page }</IdeaDetailNavigatorLayout>;

export default About;
