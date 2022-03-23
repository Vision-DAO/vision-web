import { NavItem } from "./NavItem";

export type NavProps = {
	/**
	 * The items to display in the panel, and what to do when each item is selected.
	 */
	items: ReturnType<typeof NavItem>[],

	/**
	 * What to do when the user requests that they change Vision's settings.
	 */
	onSettingsActive: () => void,

	/**
	 * What to do when the user requests to connect to ceramic. This will only be
	 * available when the user's profile is not available.
	 */
	onConnectRequested: () => void,
};

/**
 * A component allowing the user to switch between multiple contexts, view their
 * profile info, and connect to ceramic if necessary.
 */
export const NavPanel = ({ items }: NavProps) => {
	return (
		<ul>
			{ items.map((item, i) => <li key={i}>{ item }</li>) }
		</ul>
	);
};

export default NavPanel;
