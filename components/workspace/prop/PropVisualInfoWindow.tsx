import { VisualDisplaySelector } from "../../status/VisualDisplaySelector";
import { ImageRounded, InfoRounded } from "@mui/icons-material";
import { IdeaMetadataDisplay } from "../idea/prevwindow/IdeaMetadataDisplay";
import { useIdeaBinaryData } from "../../../lib/util/ipfs";
import { PropInfo } from "../../../lib/util/proposals/module";
import { PropVoteVisualization } from "./PropVoteVisualization";
import Web3 from "web3";

/**
 * Displays information about the vote distribution, and the metadata of the
 * proposal.
 */
export const PropVisualInfoWindow = ({ prop }: { prop: PropInfo }) => {
	const data = useIdeaBinaryData(prop.ipfsAddr);

	const availableViews = {
		Info: {
			content: (
				<PropVoteVisualization
					yesVotes={prop.votesFor}
					noVotes={prop.votesAgainst}
					possibleVotes={prop.funder.supply}
				/>
			),
			navIcon: <InfoRounded fontSize="large" />,
		},
		Details: {
			content: <IdeaMetadataDisplay data={data} />,
			navIcon: <ImageRounded fontSize="large" />,
		},
	};

	return <VisualDisplaySelector displays={availableViews} />;
};
