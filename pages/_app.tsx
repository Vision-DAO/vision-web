import React from "react";
import { Profiler } from "react";
import { ExploreRounded, MenuRounded, VisibilityRounded } from "@mui/icons-material";

import { Provider } from "@self.id/framework";
import closeIcon from "@self.id/multiauth/assets/icon-close.svg";
import selectedIcon from "@self.id/multiauth/assets/icon-selected.svg";
import ethereumLogo from "@self.id/multiauth/assets/ethereum.png";
import metaMaskLogo from "@self.id/multiauth/assets/metamask.png";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";

import NavPanel from "../components/workspace/nav/NavPanel";
import { NavItem } from "../components/workspace/nav/NavItem";
import { guttered } from "../components/workspace/nav/NavPanel.module.css";
import { useWeb3 } from "../lib/util/web3";

import styles from "./App.module.css";
import "./index.css";

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
		path: "/",
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

	// Create
	const web3 = useWeb3();

	// Allow each navigable item to be switched to through the navbar
	const navItems = pages.map(({ label, path, icon }) =>
		<div key={ label } className={ router.pathname != path ? guttered : "" }>
			<NavItem
				label={ label }
				icon={ icon }
				onActive={ () => router.push(path) }
				active={ router.pathname == path }
			/>
		</div>
	);

	// TODO: Make ceramic modal smaller
	return (
		<Profiler >
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<Provider
				client={{ ceramic: "testnet-clay" }}
				auth={{
					modal: { closeIcon: closeIcon.src, selectedIcon: selectedIcon.src },
					networks: [
						{
							key: "ethereum",
							logo: ethereumLogo.src,
							connectors: [{ key: "injected", logo: metaMaskLogo.src }],
						}
					]
				}}
			>
				<div className={ styles.app }>
					<div className={ styles.navPanel }>
						<NavPanel
							items={navItems}
							onProfileClicked={() => router.push("/profile")}
							onSettingsActive={() => router.push("/settings")}
							ctx={web3}
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
