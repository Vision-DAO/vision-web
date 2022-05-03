import { ReactElement, useContext } from "react";
import { DetailNavigatorLayout } from "../../../components/workspace/DetailNavigatorLayout";
import { PropActivityPanel } from "../../../components/workspace/prop/PropActivityPanel";
import { PropInfoPanel } from "../../../components/workspace/prop/PropInfoPanel";
import { PropVisualInfoWindow } from "../../../components/workspace/prop/PropVisualInfoWindow";
import { ActiveProposalContext, ExtendedProposalInformation } from "../../../lib/util/ipfs";
import styles from "../../ideas/[addr]/about.module.css";
import { pages, loader } from "./module";

/**
 * A sub-navigation context that allows a user to view information about a
 * proposal, and vote on the proposal.
 */
export const About = () => {
	const [prop, ]: [ExtendedProposalInformation, unknown] = useContext(ActiveProposalContext);

	return (
		<div className={ styles.infoContainers }>
			<div className={ styles.splitPanel }>
				<PropInfoPanel prop={ prop } />
				<PropVisualInfoWindow prop={ prop } />
			</div>
			<PropActivityPanel />
		</div>
	);
};

// See notes in about.tsx
About.getLayout = (page: ReactElement) => <DetailNavigatorLayout title="Proposal" pages={ pages } loader={ loader } ctx={ ActiveProposalContext }>{ page }</DetailNavigatorLayout>;

export default About;
