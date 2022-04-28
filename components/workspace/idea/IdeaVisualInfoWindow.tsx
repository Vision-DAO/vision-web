import styles from "./IdeaVisualInfoWindow.module.css";
import { useState } from "react";
import { IdeaMetadataDisplay } from "./prevwindow/IdeaMetadataDisplay";
import { ExtendedIdeaInformation } from "../IdeaDetailCard";
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
			content: null,
			navIcon: <AccountCircleRounded fontSize="large" />,
		}
	};

	const [activeView, setActiveView] = useState<string>(Object.keys(availableViews)[0]);

	// Each navigable view has an icon that the user clicks on
	// trigger the navigation change when that's clicked
	const navItems = Object.entries(availableViews)
		.map(([vName, { navIcon }]) =>
			<div key={ vName } className={ styles.navButton + ` ${activeView === vName ? styles.active : ""}`} onClick={ () => setActiveView(vName) }>
				{ navIcon }
			</div>
		);

	// Display the information for the currently active view
	return (
		<div className={ styles.infoWindow }>
			{ availableViews[activeView].content }
			<div className={ styles.navBar }>
				{ navItems }
			</div>
		</div>
	);
};
