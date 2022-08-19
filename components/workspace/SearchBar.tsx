import {
	useState,
	ChangeEvent,
	FocusEvent,
	useEffect,
	useContext,
	ReactElement,
} from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import { BasicIdeaInformation } from "../workspace/IdeaBubble";
import { loadBasicIdeaInfo, IpfsContext } from "../../lib/util/ipfs";
import { useWeb3 } from "../../lib/util/web3";
import styles from "./SearchBar.module.css";

const defaultSearchText = "The next big thing...";

export const SearchEntry = ({
	title,
	addr,
	term,
	onClick,
	onHoverState,
}: {
	title: string;
	addr: string;
	term: string;
	onClick: () => void;
	onHoverState: (state: boolean) => void;
}) => {
	const termStart = title.toLowerCase().indexOf(term);

	return (
		<div
			onClick={onClick}
			className={styles.resultsRow}
			onMouseEnter={() => onHoverState(true)}
			onMouseLeave={() => onHoverState(false)}
		>
			<p key={addr}>{title.substring(0, termStart)}</p>
			<p className={styles.activeResult}>
				<b>{title.substring(termStart, termStart + term.length)}</b>
			</p>{" "}
			<p>{title.substring(termStart + term.length, title.length)}</p>
		</div>
	);
};

/**
 * A component that renders an input and a list of filtered results matching
 * the input criteria below it.
 */
export const SearchBar = ({
	haystack,
	selected,
	hovered,
	dehovered,
}: {
	haystack: string[];
	selected: (selected: string) => void;
	hovered: (selected: string) => void;
	dehovered: (dehovered: string) => void;
}) => {
	const [searchText, setSearchText] = useState<string>(defaultSearchText);
	const [searchResults, setSearchResults] = useState<ReactElement[]>([]);
	const [ideaInfo, setIdeaInfo] = useState<{
		[ideaAddr: string]: BasicIdeaInformation | null;
	}>({});

	const ipfs = useContext(IpfsContext);
	const [web3] = useWeb3();

	// The search bar can be minimized
	const [expanded, setExpanded] = useState<boolean>(true);

	// Recalculate the displayed query results
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setExpanded(true);
		setSearchText(e.target.value);
		setSearchResults(
			Object.values(ideaInfo)
				.filter((info) => info !== null)
				.filter((info) =>
					info.title
						.toLocaleLowerCase()
						.includes(e.target.value.toLocaleLowerCase())
				)
				.map((info) => (
					<SearchEntry
						key={info.addr}
						title={info.title}
						addr={info.addr}
						term={e.target.value.toLocaleLowerCase()}
						onClick={() => selected(info.addr)}
						onHoverState={(state: boolean) => {
							if (state) {
								hovered(info.addr);

								return;
							}

							dehovered(info.addr);
						}}
					/>
				))
		);
	};

	const handleExit = (e: FocusEvent<HTMLInputElement>) => {
		if (e.target.value.length === 0) {
			setSearchText(defaultSearchText);
			setSearchResults([]);
		}
	};

	useEffect(() => {
		(async () => {
			for (const idea of haystack) {
				// Check that the idea has not already been loaded
				if (idea in ideaInfo) continue;

				// Mark the idea as being loaded
				setIdeaInfo((allInfo) => {
					return { ...allInfo, [idea]: null };
				});

				// Load the ideap
				const info = await loadBasicIdeaInfo(ipfs, web3, idea);
				setIdeaInfo((allInfo) => {
					return { ...allInfo, [idea]: info };
				});
			}
		})();
	}, [haystack]);

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
