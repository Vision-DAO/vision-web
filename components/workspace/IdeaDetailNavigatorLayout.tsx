import styles from "./IdeaDetailNavigatorLayout.module.css";
import { useRouter } from "next/router";
import BackIcon from "@mui/icons-material/ArrowBackIosRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { ActiveIdeaContext } from "../../lib/util/ipfs";
import { useContext, ReactElement, useEffect } from "react";
import { WarningMessage } from "../status/WarningMessage";

/**
 * See nextjs documentation on layouts: a wrapper for all pages on the Idea
 * info detail screen that ensures all rendered children have a loaded, cached
 * Idea context available.
 */
export const IdeaDetailNavigatorLayout = ({ children }: { children: ReactElement }) => {
	const router = useRouter();

	// The address of the currently loaded idea should be used as a temporary
	// label, but will be replaced by the proper name of the idea
	const { addr } = router.query;

	const [ideaInfo, setIdeaInfo] = useContext(ActiveIdeaContext);

	useEffect(() => {
		// A render hasn't even been triggered if the active idea is undefined
		// Note: the ideaInfo should be set back to undefined after it is unloaded
		if (ideaInfo === undefined) {
			// TODO: Write a loader for this, retard
			setIdeaInfo(null);
		}

		return () => {
			setIdeaInfo(undefined);
		};
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

	return (
		<div className={ styles.ideaNavigationContainer }>
			<BackIcon sx={{ color: "#5D5FEF" }} onClick={ () => router.back() } />
			<h1><b>Idea: </b>{ addr }</h1>
			{ toRender }
		</div>
	);
};
