import { ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { VisualDisplaySelector } from "../../status/VisualDisplaySelector";
import { ImageRounded, InfoRounded } from "@mui/icons-material";
import { IdeaMetadataDisplay } from "../idea/prevwindow/IdeaMetadataDisplay";

export const PropVisualInfoWindow = ({ prop }: { prop: ExtendedProposalInformation }) => {
	const availableViews = {
		"Info": {
			content: <></>,
			navIcon: <InfoRounded fontSize="large" />,
		},
		"Details": {
			content: <IdeaMetadataDisplay data={ prop.data ?? [] } />,
			navIcon: <ImageRounded fontSize="large" />
		},
	};

	return (
		<VisualDisplaySelector displays={ availableViews } />
	);
};
