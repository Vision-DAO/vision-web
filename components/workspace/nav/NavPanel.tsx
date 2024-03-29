import UserProfile from "./UserProfile";
import { CircularProgress } from "@mui/material";
import OutlinedButton from "../../status/OutlinedButton";
import { HelpTooltip } from "../../status/HelpTooltip";

import styles from "./NavPanel.module.css";

import { BasicProfile } from "@datamodels/identity-profile-basic";
import {
	useViewerConnection as useConnection,
	useViewerRecord,
	EthereumAuthProvider,
	useClient,
} from "@self.id/framework";
import { IDX } from "@ceramicstudio/idx";
import {
	useConnStatus,
	requestChangeNetwork,
	connectMetamask,
	accounts,
	AuthContext,
	IdxContext,
} from "../../../lib/util/networks";
import { useGraph } from "../../../lib/util/graph";
import { getAll, IpfsContext } from "../../../lib/util/ipfs";
import { blobify } from "../../../lib/util/blobify";
import Web3 from "web3";

import { ReactElement, useContext, useEffect, useState } from "react";

export type NavProps = {
	/**
	 * The items to display in the panel, and what to do when each item is selected.
	 */
	items: ReactElement[];

	/**
	 * What to do when the user clicks their profile
	 */
	onProfileClicked: (selfId: string) => void;

	/**
	 * What to do when the user requests that they change Vision's settings.
	 */
	onSettingsActive: () => void;

	/**
	 * The application web3 & ethereum provider, if it is available.
	 */
	ctx?: [Web3, any];
};

declare global {
	interface Window {
		ethereum: any;
	}
}

/**
 * A component allowing the user to switch between multiple contexts, view their
 * profile info, and connect to ceramic if necessary.
 *
 * - Renders the user's profile info, linking to /profile
 * - Renders a settings button, linking to /settings
 */
export const NavPanel = ({ items, onProfileClicked, ctx }: NavProps) => {
	// Wrap details of the user's login for component convenience.
	// Assume the user is disconnected
	let sessionInfo:
		| undefined
		| [BasicProfile | null | "loading", Uint8Array | null | "loading"] =
		undefined;
	const [pfp, setPfp] = useState(null);

	// Whether we are currently connected to ceramic, hooks to connect/disconnect
	const [connection, connect] = useConnection();
	const client = useClient();

	// For loading the user's profile
	const ipfs = useContext(IpfsContext);
	const graph = useGraph();
	const [, setAuth] = useContext(AuthContext);
	const [, setIdx] = useContext(IdxContext);
	const [activeAddr, setActiveAddr] = useState(null);

	// Whether or not the user is connected to an ethereum provider.
	// Should display an error otherwise
	const [{ present, connected, initialized, network }, initialize] =
		useConnStatus();

	// The user's profile. May be loaded, or may not even exist because the user is disconnected from ceramic
	// TODO: This bugs out and causes infinite re-renders
	const profileRecord = useViewerRecord("basicProfile");

	useEffect(() => {
		if (!profileRecord.isLoading && pfp == null) {
			if (!profileRecord.content || !profileRecord.content.image) {
				setPfp(null);

				return;
			}

			if (pfp != "loading" && ipfs !== null) {
				getAll(
					ipfs,
					profileRecord.content.image.original.src.replaceAll("ipfs://", "")
				).then((imgBlob) => {
					setPfp(blobify(window, imgBlob, null));
				});
			}
		}
	}, [profileRecord.content, ipfs]);

	// Setup listeners to ceramic events
	switch (connection.status) {
		case "connecting":
			// Trigger loading icons
			sessionInfo = ["loading", "loading"];

			break;
		case "connected":
			// Since the network is connected, the local user's information might
			// now be available
			if (profileRecord.isLoading) {
				sessionInfo = ["loading", "loading"];
			} else {
				sessionInfo = [profileRecord.content, "loading"];
			}

			break;
	}

	// Show a button to initiate authentication if no user info is available
	let profileDisp = (
		<div className={styles.loginBtnContainer}>
			<OutlinedButton severity="error">
				<h2>
					Unable to communicate with the Ethereum network. Check console to
					troubleshoot.
				</h2>
			</OutlinedButton>
		</div>
	);

	// Make sure a web3 client is available
	if (!present) {
		profileDisp = (
			<div className={styles.loginBtnContainer}>
				<OutlinedButton
					callback={() => window.open("https://metamask.io/")}
					severity="error"
				>
					<h2>
						Please install a <b>Web3</b> provider to continue.
					</h2>
				</OutlinedButton>
			</div>
		);
	}

	if (connected) {
		// Make sure the user is connected to the right network
		profileDisp = (
			<div className={styles.loginBtnContainer}>
				<OutlinedButton
					callback={() => {
						connectMetamask(window.ethereum)
							.then(() => {
								initialize();
								if (network != "polygon-test")
									return requestChangeNetwork(window.ethereum);
							})
							.then(async () => {
								const active = (await accounts(window.ethereum))[0];
								setActiveAddr(active);

								// Add all of the user's vision tokens to metamask
								let tokens: Set<String> = new Set();
								for await (const entry of await graph.UserTokenFeed({
									id: active,
								})) {
									if (!entry.user) continue;

									for (const {
										tokens: {
											dao: { id, ticker },
										},
									} of entry.user.ideas) {
										if (tokens.has(id)) return;

										tokens.add(id);
									}
								}
							});
					}}
					severity="action"
				>
					<h2>
						Connect to <b>Arbitrum</b>
					</h2>
				</OutlinedButton>
			</div>
		);
	}

	if (connected && sessionInfo === undefined && activeAddr) {
		profileDisp = (
			<div className={styles.loginBtnContainer}>
				<OutlinedButton
					callback={() => {
						const auth = new EthereumAuthProvider(window.ethereum, activeAddr);

						connect(auth);
						setAuth(auth);
						setIdx(
							new IDX({ ceramic: client.ceramic as unknown as CeramicApi })
						);
					}}
					severity="action"
				>
					<h2>
						Connect to <b>Ceramic</b>
					</h2>
					<HelpTooltip style="secondary">
						<p>
							Logging in with ceramic gives you access to social features like
							profile pictures, and bios. Using ceramic is required for now.
						</p>
					</HelpTooltip>
				</OutlinedButton>
			</div>
		);
	}

	// The user is already logged in, their info just needs to load
	if (sessionInfo != undefined && initialized) {
		// If the user is not signed in, a default account should be available and editable
		profileDisp = (
			<div
				onClick={() =>
					connection.status == "connected" && onProfileClicked(activeAddr)
				}
			>
				<UserProfile u={{ name: "" }} />
			</div>
		);

		const [profile] = sessionInfo;

		if (profile != null) {
			// Display a loading icon until the user's profile text (at least) is
			// available
			profileDisp = <CircularProgress sx={{ color: "white" }} />;

			if (profile != "loading" && connection.status == "connected")
				profileDisp = (
					<div onClick={() => onProfileClicked(activeAddr)}>
						<UserProfile u={profile} profilePicture={pfp} />
					</div>
				);
		}
	}

	return (
		<div className={styles.navPanel}>
			<div className={styles.infoSection}>
				<div className={`${styles.guttered} ${styles.separated}`}>
					{profileDisp}
				</div>
			</div>
			<ul className={styles.navItems}>
				{items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>
			<img className={styles.logo} src="/Vision_Eye_Transparent.png" />
		</div>
	);
};

export default NavPanel;
