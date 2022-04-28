import styles from "./IdeaDetailNavigatorLayout.module.css";
import { useRouter } from "next/router";
import BackIcon from "@mui/icons-material/ArrowBackIosRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { ActiveIdeaContext, loadExtendedIdeaInfo, loadBasicIdeaInfo, IpfsContext } from "../../lib/util/ipfs";
import { useConnStatus } from "../../lib/util/networks";
import { useWeb3 } from "../../lib/util/web3";
import { useContext, ReactElement, useEffect } from "react";
import { WarningMessage } from "../status/WarningMessage";

// Names of subpages for an Idea -- how they should be rendered
const pages = ["About", "Proposals", "Discussion", "Market"];

/**
 * See nextjs documentation on layouts: a wrapper for all pages on the Idea
 * info detail screen that ensures all rendered children have a loaded, cached
 * Idea context available.
 */
export const IdeaDetailNavigatorLayout = ({ children }: { children: ReactElement }) => {
	const router = useRouter();
	const ipfs = useContext(IpfsContext);
	const [connStatus, ,] = useConnStatus();
	const [web3, ] = useWeb3();

	// The address of the currently loaded idea should be used as a temporary
	// label, but will be replaced by the proper name of the idea
	const { addr: addrs } = router.query;

	// Where the user is currently located (indicates active nav item)
	const page = router.pathname.split("/").at(-1);

	let addr: string;

	// Nextjs props have multiple possible values
	if (Array.isArray(addrs))
		addr = addrs[0];
	else
		addr = addrs;

	const [ideaInfo, setIdeaInfo] = useContext(ActiveIdeaContext);

	useEffect(() => {
		// A render hasn't even been triggered if the active idea is undefined
		// Note: the ideaInfo should be set back to undefined after it is unloaded
		if (ideaInfo === undefined) {
			// TODO: Write a loader for this, retard
			(async () => {
				const basicInfo = await loadBasicIdeaInfo(ipfs, web3, addr);

				if (!basicInfo)
					return;

				// Note for in the morning:
				// - You were going to work on the idea detail pages, and finish
				// the loader for the idea context
				setIdeaInfo(null);

				setIdeaInfo(await loadExtendedIdeaInfo(ipfs, connStatus.network, web3, basicInfo));
			})();
		}
	});

	// If IdeaInfo is undefined, a load hasn't even been attempted, which
	// indicates that it could not be loaded for some reason, presumably because
	// it is not a valid idea
	let toRender: ReactElement = <WarningMessage title="Invalid Idea" message="The selected idea cannot be loaded. Check the address, or try again later." />;

	if (ideaInfo === null) {
		toRender = <CircularProgress />;
	} else {
		toRender = children;
	}

	// Navigates to a page under the current, active idea
	// router.push will replace [addr] in the address by default
	const navigatePage = (page: string) => {
		router.push(`/ideas/${addr}/${page}`);
	};

	// Where the user should be redirected for info about the idea
	const ideaURI = `${ (ideaInfo && ideaInfo.explorerURI) || "https://mumbai.polygonscan.com" }/address/${addr}`;

	return (
		<div className={ styles.ideaNavigationContainer }>
			<div className={ styles.navigationBarContainer }>
				<BackIcon sx={{ color: "#5D5FEF" }} fontSize="large" onClick={ () => router.back() } />
				<h2>
					<b>Idea: </b>
					<a href={ ideaURI } target="_blank" rel="noopener noreferrer">
						{ ideaInfo && ideaInfo.title || addr }
					</a>
				</h2>
			</div>
			<div className={ styles.navOptionsContainer }>
				{ pages.map((pageName) =>
					<h2
						className={ pageName.toLowerCase() == page ? styles.active : "" }
						key={ pageName }
						onClick={ () => navigatePage(pageName.toLowerCase()) }
					>{ pageName }</h2>
				) }
			</div>
			<div className={ styles.navigatedContent }>
				{ toRender }
			</div>
		</div>
	);
};
