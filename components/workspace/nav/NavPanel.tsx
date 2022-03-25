import UserProfile from "./UserProfile";
import { CircularProgress } from "@mui/material";
import OutlinedButton from "../../status/OutlinedButton";

import styles from "./NavPanel.module.css";

import { BasicProfile } from "@datamodels/identity-profile-basic";
import { useConnection, useViewerRecord } from "@self.id/framework";

import { ReactElement, useEffect, useState } from "react";

export type NavProps = {
	/**
	 * The items to display in the panel, and what to do when each item is selected.
	 */
	items: ReactElement[],

	/**
	 * What to do when the user clicks their profile
	 */
	onProfileClicked: () => void,

	/**
	 * What to do when the user requests that they change Vision's settings.
	 */
	onSettingsActive: () => void,
};

declare global {
    interface Window {
        ethereum: boolean | undefined;
    }
}

/**
 * A component allowing the user to switch between multiple contexts, view their
 * profile info, and connect to ceramic if necessary.
 *
 * - Renders the user's profile info, linking to /profile
 * - Renders a settings button, linking to /settings
 */
export const NavPanel = ({ items, onProfileClicked }: NavProps) => {
	// Wrap details of the user's login for component convenience.
	// Assume the user is disconnected
	let sessionInfo: undefined | [BasicProfile | null | "loading", Uint8Array | null | "loading"] = undefined;

	// Whether we are currently connected to ceramic, hooks to connect/disconnect
	const [connection, connect, ] = useConnection();

	// Whether or not the user is connected to an ethereum provider.
	// Should display an error otherwise
	const [ethConnection, setEthConnection] = useState(false);

	// The user's profile. May be loaded, or may not even exist because the user is disconnected from ceramic
	const profileRecord = useViewerRecord("basicProfile");

	// Setup listeners to ceramic events
	switch (connection.status) {
	case "connecting":
		// Trigger loading icons
		sessionInfo = ["loading", "loading"];

		break;
	case "connected":
		// Since the network is connected, the local user's information might
		// now be available
		if (profileRecord.isLoading)
			sessionInfo = ["loading", "loading"];
		else
			sessionInfo = [profileRecord.content, "loading"];

		break;
	}

	// Show a button to initiate authentication if no user info is available
	let profileDisp = (
		<OutlinedButton callback={ () => window.open("https://metamask.io/") } severity="error">
			Please install a Web3 provider to continue.
		</OutlinedButton>
	);

	if (ethConnection) {
		profileDisp = (
			<OutlinedButton callback={ () => connect() } severity="action">
				<h2>Login with <b>3ID Connect</b></h2>
			</OutlinedButton>
		);
	}

	// The user is already logged in, their info just needs to load
	if (sessionInfo != undefined) {
		// If the user is not signed in, a default account should be available and editable
		profileDisp = (
			<div onClick={ () => onProfileClicked() }>
				<UserProfile u={{ name: "" }} />
			</div>
		);

		const [profile, pic] = sessionInfo;

		if (profile != null) {
			// Display a loading icon until the user's profile text (at least) is
			// available
			profileDisp = <CircularProgress sx={{ color: "white" }} />;

			if (profile != "loading")
				profileDisp = (
					<div onClick={ () => onProfileClicked() }>
						<UserProfile u={ profile } profilePicture={ pic } />
					</div>
				);
		}
	}

	// Check that the user has an ethereum instance injected
	useEffect(() => {
		if (window.ethereum) {
			setEthConnection(true);
		}
	});

	return (
		<div className={styles.navPanel}>
			<div className={styles.infoSection}>
				<div className={ `${styles.guttered} ${styles.separated}` }>
					{ profileDisp }
				</div>
			</div>
			<ul className={styles.navItems}>
				{ items.map((item, i) => <li key={i}>{ item }</li>) }
			</ul>
		</div>
	);
};

export default NavPanel;
