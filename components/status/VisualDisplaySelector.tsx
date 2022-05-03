import styles from "./VisualDisplaySelector.module.css";
import { useState, ReactElement } from "react";

/*
 * A view that is selectable via the selector.
 */
export interface Display {
	content: ReactElement;
	navIcon: ReactElement;
}

/**
 * A window where visual information can be rendered. Navigable with provided
 * icons.
 */
export const VisualDisplaySelector = ({ displays: availableViews }: { displays: { [display: string]: Display } }) => {
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
