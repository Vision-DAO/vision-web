import { IdeaMetadataDisplay } from "./prevwindow/IdeaMetadataDisplay";
import { VisionaryListDisplay } from "./prevwindow/VisionaryListDisplay";
import { ExtendedIdeaInformation } from "../IdeaDetailCard";
import { VisualDisplaySelector } from "../../status/VisualDisplaySelector";
import InfoRounded from "@mui/icons-material/InfoRounded";
import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";

export const IdeaVisualInfoWindow = ({ idea }: { idea: ExtendedIdeaInformation }) => {
	// The visual display for an idea has multiple tabs:
	const availableViews = {
		"Info": {
			content: <IdeaMetadataDisplay data={ idea.data ?? [] }/>,
			navIcon: <InfoRounded fontSize="large" />,
		},
		"Visionaries": {
			content: <VisionaryListDisplay idea={ idea } />,
			navIcon: <AccountCircleRounded fontSize="large" />,
		}
	};

	// Display the information for the currently active view
	return (
		<VisualDisplaySelector displays={ availableViews } />
	);
};
