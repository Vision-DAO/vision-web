import {
	useState,
	useEffect,
	ChangeEvent,
	FocusEvent,
	useContext,
	ReactElement,
} from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import { Skeleton } from "@mui/material";
import styles from "./SearchBar.module.css";
import {
	SearchQuery,
	SearchDocument,
	SearchQueryVariables,
	GetAllUsersQuery,
	GetAllUsersDocument,
	execute,
} from "../../.graphclient";
import { useStream } from "../../lib/util/graph";
import { blobify } from "../../lib/util/blobify";
import {
	useProfiles,
	IpfsStoreContext,
	IpfsContext,
	getAll,
} from "../../lib/util/ipfs";
import { useRouter } from "next/router";

const defaultSearchText = "The next big thing...";

export const SearchEntry = ({
	iconSrc,
	title,
	ticker,
	addr,
	onClick,
	onHoverState,
}: {
	iconSrc?: string;
	title: string;
	ticker?: string;
	addr: string;
	onClick: () => void;
	onHoverState: (state: boolean) => void;
}) => {
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);
	const ipfs = useContext(IpfsContext);
	const [icon, setIcon] = useState<string | undefined | null>(undefined);

	useEffect(() => {
		if (!iconSrc) return;

		if (iconSrc in ipfsCache && "icon" in ipfsCache[iconSrc]) {
			setIcon(ipfsCache[iconSrc]["icon"] as string);

			return;
		}

		// Load the icon
		getAll(ipfs, iconSrc).then((imgBlob) => {
			// Turn the image data into an src, and update the UI
			const blob = blobify(window, imgBlob, null);

			setIpfsCache(iconSrc, "icon", blob);
			setIcon(blob);
		});
	}, [iconSrc]);

	return (
		<div
			onClick={onClick}
			className={styles.resultsEntry}
			onMouseEnter={() => onHoverState(true)}
			onMouseLeave={() => onHoverState(false)}
		>
			{icon ? (
				<img src={icon} className={styles.resultIcon} />
			) : (
				icon === undefined && <Skeleton variant="circular" />
			)}
			<p className={styles.formalText} style={{ fontWeight: "bold" }}>
				{title}
			</p>
			{ticker && <p style={{ opacity: "0.6" }}>{ticker}</p>}
			<p style={{ flexGrow: 2, textAlign: "end" }}>{addr}</p>
		</div>
	);
};

/**
 * A component that renders an input and a list of filtered results matching
 * the input criteria below it.
 */
export const SearchBar = ({
	selected,
	hovered,
	dehovered,
}: {
	selected: (selected: string) => void;
	hovered: (selected: string) => void;
	dehovered: (dehovered: string) => void;
}) => {
	// Allow searching through user profiles, as well
	const users = useStream<GetAllUsersQuery>(
		{ users: [] },
		GetAllUsersDocument,
		{}
	);
	const profiles = useProfiles(
		users.users.map((user: GetAllUsersQuery["users"][0]) => user.id)
	);
	const router = useRouter();

	const [searchText, setSearchText] = useState<string>(defaultSearchText);
	const [searchResults, setSearchResults] = useState<ReactElement[]>([]);
	const [queuedQuery, setQueuedQuery] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	// The search bar can be minimized
	const [expanded, setExpanded] = useState<boolean>(true);

	// Recalculate the displayed query results
	const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
		setExpanded(true);
		setSearchText(e.target.value);

		// Wait 2 seconds after typing has stopped to search
		if (queuedQuery) clearTimeout(queuedQuery);

		setQueuedQuery(
			setTimeout(async () => {
				// Assume the user wants results with all keywords
				const query: SearchQueryVariables = {
					text: e.target.value.replaceAll(" ", " & "),
				};

				const terms = e.target.value.toLowerCase().split(" ");

				const res = await execute(SearchDocument, query);
				const data: SearchQuery = res.data ?? {
					ideaPropSearch: [],
				};

				const matchingProfiles = Object.entries(profiles)
					.filter(([, profile]) => profile.name !== undefined)
					.filter(([, profile]) =>
						terms.every((term) => profile.name.toLowerCase().includes(term))
					);

				setSearchResults([
					...data.ideaPropSearch.map((info) => (
						<SearchEntry
							key={info.id}
							addr={info.id}
							ticker={info.ticker}
							title={info.name}
							onClick={() => selected(info.id)}
							onHoverState={(state: boolean) => {
								if (state) {
									hovered(info.id);

									return;
								}

								dehovered(info.id);
							}}
						/>
					)),
					...matchingProfiles.map(([addr, profile]) => (
						<SearchEntry
							title={profile.name}
							addr={addr}
							onClick={() => router.push(`/profile/${addr}`)}
							onHoverState={() => {}}
							iconSrc={profile.image?.original.src.replaceAll("ipfs://", "")}
						/>
					)),
				]);
			}, 500)
		);
	};

	const handleExit = (e: FocusEvent<HTMLInputElement>) => {
		if (e.target.value.length === 0) {
			setSearchText(defaultSearchText);
			setSearchResults([]);
		}
	};

	// Toggles the expansion state
	const handleExpand = () => setExpanded((expanded) => !expanded);

	return (
		<div className={styles.searchBarContainer}>
			<div
				className={`${styles.queryArea} ${styles.searchContent} ${
					expanded && searchResults.length > 0 ? styles.hasResults : ""
				}`}
			>
				<SearchRounded />
				<input
					type="text"
					value={searchText}
					onClick={() => setSearchText("")}
					onChange={handleChange}
					onBlur={handleExit}
				/>
			</div>
			{expanded && (
				<div className={`${styles.resultsArea} ${styles.searchContent}`}>
					{searchResults}
				</div>
			)}
			{searchResults.length > 0 && (
				<div className={styles.expansionTab} onClick={handleExpand}>
					{expanded ? <ExpandMore /> : <ExpandLess />}
				</div>
			)}
		</div>
	);
};
