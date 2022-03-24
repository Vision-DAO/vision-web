import { NavItem } from "./NavItem";
import UserProfile from "./UserProfile";
import LoadingIcon from "../../status/Loading";
import OutlinedButton from "../../status/OutlinedButton";

import styles from "./NavPanel.module.css";
import { BasicProfile } from "@datamodels/identity-profile-basic";

export type NavProps = {
	/**
	 * The items to display in the panel, and what to do when each item is selected.
	 */
	items: ReturnType<typeof NavItem>[],

	/**
	 * The details of the currently logged in user to display on the navigation bar
	 */
	sessionInfo?: [null | BasicProfile | "loading", null | Uint8Array | "loading"],

	/**
	 * What to do when the user clicks their profile
	 */
	onProfileClicked: () => void,

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
export const NavPanel = ({ items, sessionInfo, onConnectRequested, onProfileClicked }: NavProps) => {
	// Show a button to initiate authentication if no user info is available
	let profileDisp = (
		<OutlinedButton callback={ onConnectRequested }>
			<h2>Login with <em>3ID Connect</em></h2>
		</OutlinedButton>
	);

	// The user is already logged in, their info just needs to load
	if (sessionInfo != undefined) {
		// If the user is not signed in, a create account button should be avilable
		profileDisp = (
			<OutlinedButton callback={ onProfileClicked }>
				Create Account
			</OutlinedButton>
		);

		const [profile, pic] = sessionInfo;

		if (profile != null) {
			// Display a loading icon until the user's profile text (at least) is
			// available
			profileDisp = <LoadingIcon />;

			if (profile != "loading")
				profileDisp = <UserProfile u={ profile } profilePicture={ pic } />;
		}
	}

	return (
		<div className={styles.navPanel}>
			{ profileDisp }
			<ul className={styles.navItems}>
				{ items.map((item, i) => <li key={i}>{ item }</li>) }
			</ul>
		</div>
	);
};

export default NavPanel;
