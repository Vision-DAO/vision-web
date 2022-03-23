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
	icon: string,

	/**
	 * What to do when the item is selected.
	 */
	onActive: () => void,
}

/**
 * A component representing a selectable item in the navigation panel.
 */
export const NavItem = ({ label, icon, onActive }: NavItemProps) => {
	return (
		<div className="navbutton">
			<span className="material-icons-round">
				{ icon }
			</span>
			<h1>{ label }</h1>
		</div>
	);
};

export default NavItem;
