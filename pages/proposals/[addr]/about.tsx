import { ReactElement, useContext } from "react";
import { DetailNavigatorLayout } from "../../../components/workspace/DetailNavigatorLayout";
import { PropActivityPanel } from "../../../components/workspace/prop/PropActivityPanel";
import { PropVotePanel } from "../../../components/workspace/prop/PropVotePanel";
import { PropInfoPanel } from "../../../components/workspace/prop/PropInfoPanel";
import { PropVisualInfoWindow } from "../../../components/workspace/prop/PropVisualInfoWindow";
import { ActiveProposalContext, ExtendedProposalInformation, IpfsContext } from "../../../lib/util/ipfs";
import { useWeb3 } from "../../../lib/util/web3";
import { useConnStatus } from "../../../lib/util/networks";
import styles from "../../ideas/[addr]/about.module.css";
import { pages, loader } from "./module";

/**
 * A sub-navigation context that allows a user to view information about a
 * proposal, and vote on the proposal.
 */
export const About = () => {
	const [prop, ]: [ExtendedProposalInformation, unknown] = useContext(ActiveProposalContext);
	const [web3, eth] = useWeb3();
	const [conn, ] = useConnStatus();
	const ipfs = useContext(IpfsContext);

	return (
		<div className={ styles.infoContainers }>
			<div className={ styles.splitPanel }>
				<PropInfoPanel ipfs={ ipfs } prop={ prop } web3={ web3 } conn={ conn } />
				<PropVisualInfoWindow web3={ web3 } prop={ prop } />
			</div>
			<PropVotePanel prop={ prop } web3={ web3 } eth={ eth } />
			<PropActivityPanel web3={ web3 } conn={ conn } prop={ prop } />
		</div>
	);
};

// See notes in about.tsx
About.getLayout = (page: ReactElement) => <DetailNavigatorLayout title="Proposal" pages={ pages } loader={ loader } ctx={ ActiveProposalContext }>{ page }</DetailNavigatorLayout>;

export default About;
