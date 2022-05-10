import React from "react";
import { useEffect, useState, ReactElement } from "react";
import { HomeRounded, MenuRounded, VisibilityRounded } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";

import { Provider } from "@self.id/framework";
import closeIcon from "@self.id/multiauth/assets/icon-close.svg";
import selectedIcon from "@self.id/multiauth/assets/icon-selected.svg";
import ethereumLogo from "@self.id/multiauth/assets/ethereum.png";
import metaMaskLogo from "@self.id/multiauth/assets/metamask.png";
import { create, multiaddr } from "ipfs-core";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextPage } from "next";

import { NetworkedWorkspace } from "../components/workspace/Networked";
import NavPanel from "../components/workspace/nav/NavPanel";
import { NavItem } from "../components/workspace/nav/NavItem";
import navStyles from "../components/workspace/nav/NavPanel.module.css";
import { Web3Context, provideWeb3 } from "../lib/util/web3";
import { IpfsContext, ActiveIdeaContext, ActiveProposalContext, ProposalsContext, GossipProposalInformation } from "../lib/util/ipfs";
import { ConnectionContext, provideConnStatus } from "../lib/util/networks";
import { ModalContext } from "../lib/util/modal";

import styles from "./App.module.css";
import "./App.css";
import "./index.css";

/**
 * See nextjs documentation on layouts.
 * Convenient type definitions for pages that have .getLayout methods for
 * composition.
 */
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactElement
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

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
		icon: <HomeRounded />,
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

// Global theme settings for Material UI.
// Not dynamic, yet
const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#FFFFFF",
		}
	},
});

/**
 * A component that shares a global navigation workspace layout between
 * active, routed pages.
 */
const App = ({ Component, pageProps }: AppPropsWithLayout) => {
	// For indicating the active page in the navbar
	const router = useRouter();

	// Create a global web3 client
	const web3 = provideWeb3();

	// Create a global connection status state
	const connStatus = provideConnStatus(web3 ? web3[1] : undefined);

	// Multiple pages share info about the currently expanded idea (i.e., the
	// idea on the second figma page)
	const [activeIdea, setActiveIdea] = useState(undefined);
	const [activeProposal, setActiveProposal] = useState(undefined);

	// Keep the global IPFS intance up to date
	const [ipfs, setIpfs] = useState(undefined);

	// A global cache for props
	const [proposalCache, setProposals] = useState<{ [addr: string]: GossipProposalInformation[] }>({});

	const addProposal = (addr: string, prop: GossipProposalInformation) => {
		setProposals((props) => { return { ...props, [addr]: props[addr] ? (props[addr].includes(prop) ? props[addr] : [...props[addr], prop]) : [prop] };});
	};

	useEffect(() => {
		if (ipfs === undefined) {
			setIpfs(null);
			create().then((ipfs) => {
				// TODO: Auto-generate this testing peer on testing environments
				//
				// TODO: Figure out why IPFS isn't properly subscribing.
				// Suspect IPFS are just a bunch of dumbfucks that can't write good
				// software
				ipfs.bootstrap.clear()
					.then(() => {
						ipfs.bootstrap.add(
							new multiaddr("/ip4/127.0.0.1/tcp/4003/ws/p2p/12D3KooWNXL7qtg58ku53LYYmSR8N1TSUPeyBmLMwPSXmEwFxobV")
						);
						setIpfs(ipfs);
					});
			});
		}
	});

	const [hasModal, setHasModal] = useState(false);
	const [modal, setModal] = useState<ReactElement>(undefined);

	// Custom styles for the entire app
	useEffect(() => {
		const body = document.querySelector("body");
		body.classList.add(styles.root);

		const modal = document.querySelector(".threeid-connect-manage");
		
		if (modal && modal.clientWidth != 0) {
			setHasModal(true);
		} else if (hasModal) {
			setHasModal(false);
		}
	});

	// Allow each navigable item to be switched to through the navbar
	const navItems = pages.map(({ label, path, icon }) =>
		<div key={ label } className={ router.pathname != path ? navStyles.guttered : "" }>
			<NavItem
				label={ label }
				icon={ icon }
				onActive={ () => router.push(path) }
				active={ router.pathname == path }
			/>
		</div>
	);

	// Gets the layout of a component, or returns the component if it has no
	// custom layout. See nextjs layout docs:
	// https://nextjs.org/docs/basic-features/layouts
	const getLayout = Component.getLayout ?? ((page: ReactElement) => page);

	// TODO: Make ceramic modal smaller
	return (
		<>
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
				ui={{ style: { overflow: "hidden" } }}
			>
				<ThemeProvider theme={ theme }>
					<Web3Context.Provider value={ web3 }>
						<IpfsContext.Provider value={ ipfs }>
							<ConnectionContext.Provider value={ connStatus }>
								<ActiveIdeaContext.Provider value={ [activeIdea, setActiveIdea] }>
									<ProposalsContext.Provider value={ [proposalCache, addProposal] }>
										<ActiveProposalContext.Provider value={ [activeProposal, setActiveProposal] }>
											<ModalContext.Provider value={ [modal, setModal] }>
												{ router.pathname !== "/login" ?
													<div className={ `${styles.app} ${styles.root}${hasModal ? (" " + styles.hidden) : ""}` }>
														<div className={ styles.navPanel }>
															<NavPanel
																items={navItems}
																onProfileClicked={(selfId: string) => router.push({
																	pathname: "/profile/[id]",
																	query: { id: selfId } }
																)}
																onSettingsActive={() => router.push("/settings")}
																ctx={web3}
															/>
														</div>
														<div className={styles.workspace}>
															<NetworkedWorkspace>
																{ getLayout(<Component {...pageProps} />) }
															</NetworkedWorkspace>
														</div>
													</div>
													: <div className={ `${styles.app} ${styles.root}` }><Component {...pageProps} /></div> }
											</ModalContext.Provider>
										</ActiveProposalContext.Provider>
									</ProposalsContext.Provider>
								</ActiveIdeaContext.Provider>
							</ConnectionContext.Provider>
						</IpfsContext.Provider>
					</Web3Context.Provider>
				</ThemeProvider>
			</Provider>
		</>
	);
};

export default App;
