import React from "react";
import { useState } from "react";

import { BasicProfile } from "@datamodels/identity-profile-basic";

import { ExploreRounded, MenuRounded, VisibilityRounded } from "@mui/icons-material";
import { useViewerRecord, useConnection, Provider } from "@self.id/framework";

import type { AppProps } from "next/app";
import Link from "next/link";
import NavPanel from "./workspace/nav/NavPanel";
import { NavItem } from "./workspace/nav/NavItem";
import styles from "./App.module.css";

/**
 * A page navigable in the application.
 */
interface Page {
	label: string;
	path: string;

	icon: React.ReactElement;
	root: React.ReactElement,
}

// pages navigable through the main application
const pages: Page[] = [
	{
		label: "Explore",
		path: "/explore",
		icon: <ExploreRounded />,
		root: <p>explore</p>,
	},
	{
		label: "My Ideas",
		path: "/collection",
		icon: <MenuRounded />,
		root: <p>my ideas</p>,
	},
	{
		label: "Following",
		path: "/following",
		icon: <VisibilityRounded />,
		root: <p>visibility</p>
	}
];

/**
 * A component that shares a global navigation workspace layout between
 * active, routed pages.
 */
const App = ({ Component, pageProps }: AppProps) => {
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
	const navItems = pages.map(({ label, path, icon, root }) =>
		<Link key={ label } href={{ pathname: path }}>
			<NavItem
				label={ label }
				icon={ icon }
				active={ ctx == root }
				onActive={() => setCtx(root)}
			/>
		</Link>
	);

	return (
		<Provider client={{ ceramic: "testnet-clay" }}>
			<div className={ styles.app }>
				<div className="nav-panel">
					<NavPanel
						sessionInfo={userInfo}
						items={navItems}
						onConnectRequested={() => alert("Connect?")}
					/>
				</div>
				<div className="workspace">
					<Component {...pageProps} />
				</div>
			</div>
		</Provider>
	);
};

export default App;
