import React from "react";
import { useEffect, useState, ReactElement } from "react";
import {
	HomeRounded,
	MenuRounded,
	VisibilityRounded,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";

import { ModelTypesToAliases } from "@glazed/types";
import { Provider, EthereumAuthProvider } from "@self.id/framework";
import { IDX } from "@ceramicstudio/idx";
import closeIcon from "../public/icons/icon-close.svg";
import selectedIcon from "../public/icons/icon-selected.svg";
import ethereumLogo from "../public/icons/ethereum.png";
import metaMaskLogo from "../public/icons/metamask.png";
import { create } from "ipfs-core";

import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextPage } from "next";

import { NetworkedWorkspace } from "../components/workspace/Networked";
import NavPanel from "../components/workspace/nav/NavPanel";
import { NavItem } from "../components/workspace/nav/NavItem";
import navStyles from "../components/workspace/nav/NavPanel.module.css";
import { Web3Context, provideWeb3 } from "../lib/util/web3";
import { ClientContext } from "../lib/util/graph";
import { getBuiltGraphSDK } from "../.graphclient";
import EthCrypto from "eth-crypto";
import { IpfsContext, IpfsStoreContext } from "../lib/util/ipfs";
import { ActiveIdeaContext } from "../lib/util/ideas/module";
import { ActiveProposalContext } from "../lib/util/proposals/module";
import {
	ConnectionContext,
	provideConnStatus,
	AuthContext,
	IdxContext,
	VisContext,
	visTokenAddr,
} from "../lib/util/networks";
import { ModalContext } from "../lib/util/modal";
import { ModelTypes } from "../lib/util/discovery";
import modelAliases from "../lib/schema/model.json";

import styles from "./App.module.css";
import "./App.css";
import "./index.css";

/**
 * See nextjs documentation on layouts.
 * Convenient type definitions for pages that have .getLayout methods for
 * composition.
 */
type NextPageWithLayout = NextPage & {
	getLayout?: (page: ReactElement) => ReactElement;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

/**
 * A page navigable in the application.
 */
interface Page {
	label: string;
	path: string;

	icon: React.ReactElement;
}

/**
 * Signed data indicating the user is who they say they are.
 */
const LOGIN_ATTESTATION = "Login to Vision.eco";

/**
 * Accounts pre-approved for Vision usage.
 */
const whitelist: string[] = [
	"0x928613da9dE038458c29fe34066fbbDe74A2DB9f",
	"0x44A3Bc524b80a50ABb252f1ffBeDF21Dba50445C",
	"0xecDd164e108EE04736EE264e00B7a024267fc62b",
	"0xdc36FA7961324b2403e4DD8B9c3bdd27c725E693",
	"0xA3539fbf4399C5C09fa3c070b0bc155f0B184589",
	"0x40c519d4dfc6B426B0285CC78f05c958708c88b2",
	"0xCf457e101EF999C95c6563A494241D9C0aD8763B",
	"0xe7FBEE6F331E209a6C4B2b1f8Eb382d54F438B76",
	"0xc32dC5713162479dfD0e0B7E54780DcF23A58fc7",
	"0x9405c86c9021F068b5d2a7a6A818c34A85252f23",
	"0xd3Fe8b4f1CF50E27fE8707921d38B77F09aC6Db8",
	"0x38aAA5b1A4EA15D86Cd875FC958c1274Fd496835",
	"0xC3dF0b130ECaB8D0D836cFBD9b08DC4856Fe6563",
	"0x39bee5D198c7F83281C1402A845eB8E2f4622BA2",
	"0xcFdDa7a46853EeEdA37C4C61f52f93a9D7cb2F24",
].map((s) => s.toLowerCase());

// pages navigable through the main application
const pages: Page[] = [
	{
		label: "Explore",
		path: "/",
		icon: <HomeRounded />,
	},
	{
		label: "My Ideas",
		path: "/my_ideas",
		icon: <MenuRounded />,
	},
	{
		label: "Watched",
		path: "/watched_ideas",
		icon: <VisibilityRounded />,
	},
];

// Global theme settings for Material UI.
// Not dynamic, yet
const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#FFFFFF",
		},
	},
});

const aliases: ModelTypesToAliases<ModelTypes> = modelAliases;

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
	const visAddr = visTokenAddr[connStatus[0].network];

	// Wait, globally, for someone to connect to ceramic
	const authContext = useState<EthereumAuthProvider | null>(null);
	const idxContext = useState<IDX | null>(null);

	// Keep the global IPFS intance up to date
	const [ipfs, setIpfs] = useState(undefined);
	const ideaContext = useState(undefined);
	const propContext = useState(undefined);
	const [client, setClient] = useState(undefined);

	useEffect(() => {
		setClient(getBuiltGraphSDK());
	}, []);

	const [ipfsStore, setIpfsStore] = useState({});
	const storeMutater = (cid: string, key: string, v: unknown) => {
		setIpfsStore((store) => {
			return { ...store, [cid]: { ...(store[cid] ?? {}), [key]: v } };
		});
	};

	useEffect(() => {
		if (ipfs === undefined) {
			setIpfs(null);

			create({ EXPERIMENTAL: { ipnsPubsub: true } }).then((ipfs) => {
				setIpfs(ipfs);
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
	const navItems = pages.map(({ label, path, icon }) => (
		<div
			key={label}
			className={router.pathname != path ? navStyles.guttered : ""}
		>
			<NavItem
				label={label}
				icon={icon}
				onActive={() => router.push(path)}
				active={router.pathname == path}
			/>
		</div>
	));

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
				client={{ ceramic: "testnet-clay", aliases }}
				auth={{
					modal: {
						closeIcon: closeIcon.src,
						selectedIcon: selectedIcon.src,
					},
					networks: [
						{
							key: "ethereum",
							logo: ethereumLogo.src,
							connectors: [
								{
									key: "injected",
									logo: metaMaskLogo.src,
								},
							],
						},
					],
				}}
				ui={{ style: { overflow: "hidden" } }}
			>
				<ThemeProvider theme={theme}>
					<Web3Context.Provider value={web3}>
						<ClientContext.Provider value={client}>
							<VisContext.Provider value={visAddr}>
								<IpfsContext.Provider value={ipfs}>
									<IpfsStoreContext.Provider value={[ipfsStore, storeMutater]}>
										<ConnectionContext.Provider value={connStatus}>
											<AuthContext.Provider value={authContext}>
												<ActiveIdeaContext.Provider value={ideaContext}>
													<ActiveProposalContext.Provider value={propContext}>
														<IdxContext.Provider value={idxContext}>
															<ModalContext.Provider value={[modal, setModal]}>
																{router.pathname !== "/login" ? (
																	<div
																		className={`${styles.app} ${styles.root}${
																			hasModal ? " " + styles.hidden : ""
																		}`}
																	>
																		<div className={styles.navPanel}>
																			<NavPanel
																				items={navItems}
																				onProfileClicked={(selfId: string) =>
																					router.push({
																						pathname: "/profile/[id]",
																						query: {
																							id: selfId,
																						},
																					})
																				}
																				onSettingsActive={() =>
																					router.push("/settings")
																				}
																				ctx={web3}
																			/>
																		</div>
																		<div className={styles.workspace}>
																			<NetworkedWorkspace>
																				{getLayout(
																					<Component {...pageProps} />
																				)}
																			</NetworkedWorkspace>
																		</div>
																	</div>
																) : (
																	<div
																		className={`${styles.app} ${styles.root}`}
																	>
																		<Component {...pageProps} />
																	</div>
																)}
															</ModalContext.Provider>
														</IdxContext.Provider>
													</ActiveProposalContext.Provider>
												</ActiveIdeaContext.Provider>
											</AuthContext.Provider>
										</ConnectionContext.Provider>
									</IpfsStoreContext.Provider>
								</IpfsContext.Provider>
							</VisContext.Provider>
						</ClientContext.Provider>
					</Web3Context.Provider>
				</ThemeProvider>
			</Provider>
		</>
	);
};

/**
 * TODO: Find a workaround with next edge functions that uses a fully browser
 * compatible version of web3.
 */
App.getInitialProps = async ({ ctx: { req, res }, router }) => {
	// The server has already verified the user's identity
	if (!req) return {};

	if (req) {
		// TODO: Abstract this
		if (req.url === "/login" || req.url === "/Vision_Eye_Transparent.png")
			return {};

		const signature = req.cookies[LOGIN_ATTESTATION];

		// Check that the user is an authenticated user
		if (
			signature &&
			whitelist.includes(
				EthCrypto.recover(
					signature,
					EthCrypto.hash.keccak256(
						`\x19Ethereum Signed Message:\n${LOGIN_ATTESTATION.length}${LOGIN_ATTESTATION}`
					)
				).toLowerCase()
			)
		) {
			return {};
		}
	}

	// Use two methods of redirecting
	if (res) {
		res.setHeader("location", "/login");
		res.statusCode = 302;
		res.end();
	} else if (router) {
		router.replace("/login");
	}

	// Redirect the user to the login page.
	return {};
};

export default App;
