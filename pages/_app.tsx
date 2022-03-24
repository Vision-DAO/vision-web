import React from "react";
import { ExploreRounded, MenuRounded, VisibilityRounded } from "@mui/icons-material";
import { Provider } from "@self.id/framework";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";

import NavPanel from "../components/workspace/nav/NavPanel";
import { NavItem } from "../components/workspace/nav/NavItem";
import styles from "./App.module.css";

/**
 * A page navigable in the application.
 */
interface Page {
	label: string;
	path: string;

	icon: React.ReactElement;
}

// pages navigable through the main application
const pages: Page[] = [
	{
		label: "Explore",
		path: "/index",
		icon: <ExploreRounded />,
	},
	{
		label: "My Ideas",
		path: "/collection",
		icon: <MenuRounded />,
	},
	{
		label: "Following",
		path: "/following",
		icon: <VisibilityRounded />,
	}
];

/**
 * A component that shares a global navigation workspace layout between
 * active, routed pages.
 */
const App = ({ Component, pageProps }: AppProps) => {
	// For indicating the active page in the navbar
	const router = useRouter();

	// Allow each navigable item to be switched to through the navbar
	const navItems = pages.map(({ label, path, icon }) =>
		<NavItem
			key={ label } 
			label={ label }
			icon={ icon }
			onActive={ () => router.push(path) }
			active={ router.pathname == path }
		/>
	);

	return (
		<>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<Provider client={{ ceramic: "testnet-clay" }}>
				<div className={ styles.app }>
					<div className="nav-panel">
						<NavPanel
							items={navItems}
							onConnectRequested={() => alert("Connect?")}
							onProfileClicked={() => router.push("/profile")}
						/>
					</div>
					<div className="workspace">
						<Component {...pageProps} />
					</div>
				</div>
			</Provider>
		</>
	);
};

export default App;
