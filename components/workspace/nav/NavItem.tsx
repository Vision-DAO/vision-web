import styles from "./NavItem.module.css";
import { ReactElement } from "react";

/**
 * An item that can be selected in the navigation bar with a string label,
 * a material icon name, and a callback upon selection.
 */
export interface NavItemProps {
	/**
	 * The label to use for the selectable (case-sensitive) navigation item.
	 */
	label: string,

	/**
	 * The (rounded) material icon to use for the navigation item.
	 */
	icon: ReactElement,

	/**
	 * Whether the navigation item should be highlighted.
	 */
	active: boolean,

	/**
	 * What to do when the item is selected.
	 */
	onActive: () => void,
}

/**
 * A component representing a selectable item in the navigation panel.
 */
export const NavItem = ({ label, icon, active, onActive }: NavItemProps) => {
	const style = active ? "active" : "inactive";

	return (
		<div className={ `${styles.navbutton} ${styles[style]}`} onClick={ onActive }>
			<div>
				{ icon }
				<h1>{ label }</h1>
			</div>
		</div>
	);
};

export default NavItem;
