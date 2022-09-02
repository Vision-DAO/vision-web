import styles from "./DetailNavigatorLayout.module.css";
import { useRouter } from "next/router";
import BackIcon from "@mui/icons-material/ArrowBackIosRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { useConnStatus, explorers } from "../../lib/util/networks";
import { ModalContext } from "../../lib/util/modal";
import { ReactElement, Context, useEffect, useContext, useState } from "react";
import { WarningMessage } from "../status/WarningMessage";

/**
 * See nextjs documentation on layouts: a wrapper for all pages on an
 * info detail screen that ensures all rendered children have a loaded, cached
 * Idea context available.
 */
export const DetailNavigatorLayout = <T,>({
	title,
	pages,
	children,
	ctx,
	loader,
	contentTitle,
}: {
	title: string;
	pages: string[];
	children: ReactElement;
	ctx: Context<[T | undefined, (v: T | undefined) => void]>;
	loader: (addr: string) => AsyncIterable<T | null>;
	contentTitle: (v: T) => string;
}) => {
	const router = useRouter();
	const [conn] = useConnStatus();

	// The address of the currently loaded idea should be used as a temporary
	// label, but will be replaced by the proper name of the idea
	const { addr: addrs } = router.query;

	// Where the user is currently located (indicates active nav item)
	const page = router.pathname.split("/").at(-1);

	let addr: string;

	// Nextjs props have multiple possible values
	if (Array.isArray(addrs)) addr = addrs[0];
	else addr = addrs;

	const [ideaInfo, setIdeaInfo] = useState<T | null | undefined>(undefined);
	const [, setGlobalIdeaInfo] = useContext(ctx);
	const [modal] = useContext(ModalContext);

	useEffect(() => {
		(async () => {
			for await (const info of loader(addr)) {
				if (info !== null) setGlobalIdeaInfo(info);
				setIdeaInfo(info);
			}
		})();
	}, [addr]);

	// If IdeaInfo is undefined, a load hasn't even been attempted, which
	// indicates that it could not be loaded for some reason, presumably because
	// it is not a valid idea
	let toRender: ReactElement;

	if (ideaInfo === undefined) {
		toRender = <CircularProgress />;
	} else if (ideaInfo === null) {
		toRender = (
			<WarningMessage title="Error 404" message="Idea Does Not Exist" />
		);
	} else {
		toRender = children;
	}

	// Navigates to a page under the current, active idea
	// router.push will replace [addr] in the address by default
	const navigatePage = (page: string) => {
		router.push(`/ideas/${addr}/${page}`);
	};

	// Where the user should be redirected for info about the idea
	const ideaURI = `${explorers[conn.network]}/address/${addr}`;

	return (
		<div className={styles.ideaNavigationContainer}>
			{modal !== undefined && modal}
			<div className={styles.navigationBarContainer}>
				<BackIcon
					sx={{ color: "#5D5FEF", cursor: "pointer" }}
					fontSize="large"
					onClick={() => {
						setIdeaInfo(undefined);
						router.back();
					}}
				/>
				<h2>
					<b>{title}: </b>
					<a href={ideaURI} target="_blank" rel="noopener noreferrer">
						{(ideaInfo && contentTitle(ideaInfo)) || addr}
					</a>
				</h2>
			</div>
			<div className={styles.navOptionsContainer}>
				{pages.map((pageName) => (
					<h2
						className={pageName.toLowerCase() == page ? styles.active : ""}
						key={pageName}
						onClick={() => navigatePage(pageName.toLowerCase())}
					>
						{pageName}
					</h2>
				))}
			</div>
			<div className={styles.navigatedContent}>{toRender}</div>
		</div>
	);
};
