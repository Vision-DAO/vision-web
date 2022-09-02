import { ReactElement, useContext } from "react";
import { DetailNavigatorLayout } from "../../../components/workspace/DetailNavigatorLayout";
import { IdeaInfoPanel } from "../../../components/workspace/idea/IdeaInfoPanel";
import { IdeaVisualInfoWindow } from "../../../components/workspace/idea/IdeaVisualInfoWindow";
import { IdeaActivityPanel } from "../../../components/workspace/idea/IdeaActivityPanel";
import styles from "./about.module.css";
import {
	pages,
	loader,
	titleExtractor,
	ActiveIdeaContext,
} from "../../../lib/util/ideas/module";

/**
 * A sub-navigation context that allows a user to view basic information about
 * an idea, a list of proposals about the idea, a discussion board, and
 * market metrics about the idea.
 */
export const About = () => {
	const [idea] = useContext(ActiveIdeaContext);

	console.log(idea);

	// See NavigatorLayout container. This will never be NULL
	return (
		<div className={styles.infoContainers}>
			<div className={styles.splitPanel}>
				<IdeaInfoPanel idea={idea} />
				<IdeaVisualInfoWindow idea={idea} />
			</div>
			<IdeaActivityPanel idea={idea} />
		</div>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
About.getLayout = (page: ReactElement) => (
	<DetailNavigatorLayout
		title="Idea"
		contentTitle={titleExtractor}
		ctx={ActiveIdeaContext}
		pages={pages}
		loader={loader}
	>
		{page}
	</DetailNavigatorLayout>
);

export default About;
