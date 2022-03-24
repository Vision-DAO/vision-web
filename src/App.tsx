import React from "react";
import { BasicProfile } from "@datamodels/identity-profile-basic";
import { useState } from "react";

import { ExploreRounded, MenuRounded, VisibilityRounded } from "@mui/icons-material";
import { useViewerRecord, useConnection, Provider } from "@self.id/framework";

import NavPanel from "./workspace/nav/NavPanel";
import { NavItem } from "./workspace/nav/NavItem";
import "./App.css";

/**
 * A page navigable in the application.
 */
interface Page {
	label: string;
	icon: React.ReactElement;
	root: React.ReactElement,
}

// pages navigable through the main application
const pages: Page[] = [
	{
		label: "Explore",
		icon: <ExploreRounded />,
		root: <p>explore</p>,
	},
	{
		label: "My Ideas",
		icon: <MenuRounded />,
		root: <p>my ideas</p>,
	},
	{
		label: "Following",
		icon: <VisibilityRounded />,
		root: <p>visibility</p>
	}
];

const App = () => {
	// The current item to display in the main body of the navigation workspace
	const [ctx, setCtx] = useState(pages[0].root);

	// The basic details of the logged in user should be persisted throughout the application
	const [userInfo, setUserInfo] = useState<undefined | [BasicProfile | null | "loading", Uint8Array | null | "loading"]>(undefined);
	const profileRecord = useViewerRecord("basicProfile");

	// Whether we are currently connected to ceramic, hooks to connect/disconnect
	const [connection, connect, disconnect] = useConnection();

	// Setup listeners to ceramic events
	switch (connection.status) {
	case "connecting":
		// Trigger loading icons
		setUserInfo(["loading", "loading"]);

		break;
	case "connected":
		// Since the network is connected, the local user's information might
		// now be available
		if (profileRecord.isLoading)
			setUserInfo(["loading", "loading"]);
		else if (profileRecord.content)
			setUserInfo([profileRecord.content, "loading"]);

		break;
	}

	// Allow each navigable item to be switched to through the navbar
	const navItems = pages.map(({ label, icon, root }) =>
		<NavItem
			key={ label }
			label={ label }
			icon={ icon }
			active={ ctx == root }
			onActive={() => setCtx(root)}
		/>
	);

	return (
		<Provider client={{ ceramic: "testnet-clay" }}>
			<div className="app">
				<div className="nav-panel">
					<NavPanel
						sessionInfo={userInfo}
						items={navItems}
						onProfileClicked={() => alert("profile")}
						onSettingsActive={() => alert("Settings")}
						onConnectRequested={() => alert("Connect?")}
					/>
				</div>
				<div className="workspace">
					{ ctx }
				</div>
			</div>
		</Provider>
	);
};

export default App;
