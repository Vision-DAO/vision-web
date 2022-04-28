import { ReactElement, useContext } from "react";
import { IdeaDetailNavigatorLayout } from "../../../components/workspace/IdeaDetailNavigatorLayout";
import { ExtendedIdeaInformation } from "../../../components/workspace/IdeaDetailCard";
import { ActiveIdeaContext } from "../../../lib/util/ipfs";
import styles from "./about.module.css";

/**
 * A sub-navigation context that allows a user to view basic information about
 * an idea, a list of proposals about the idea, a discussion board, and
 * market metrics about the idea.
 */
export const About = () => {
	// See NavigatorLayout container. This will never be NULL
	const [idea, ]: [ExtendedIdeaInformation, unknown] = useContext(ActiveIdeaContext);

	return (
		<div className={ styles.infoContainers }>
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
About.getLayout = (page: ReactElement) => <IdeaDetailNavigatorLayout>{ page }</IdeaDetailNavigatorLayout>;

export default About;
