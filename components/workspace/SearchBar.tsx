import { useState, ChangeEvent, FocusEvent, ReactElement } from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import styles from "./SearchBar.module.css";
import {
	SearchQuery,
	SearchDocument,
	SearchQueryVariables,
	execute,
} from "../../.graphclient";

const defaultSearchText = "The next big thing...";

export const SearchEntry = ({
	icon,
	title,
	ticker,
	addr,
	term,
	onClick,
	onHoverState,
}: {
	icon?: string;
	title: string;
	ticker: string;
	addr: string;
	term: string;
	onClick: () => void;
	onHoverState: (state: boolean) => void;
}) => {
	const termStart = title.toLowerCase().indexOf(term);
	let elems = [
		<p key="start">{title.substring(termStart + term.length, title.length)}</p>,
	];

	if (term.length > 0)
		elems = [
			<p key="middle" className={styles.activeResult}>
				<b>{title.substring(termStart, termStart + term.length)}</b>
			</p>,
			...elems,
		];

	if (termStart !== 0)
		elems = [<p key="end">{title.substring(0, termStart)}</p>, ...elems];

	return (
		<div
			onClick={onClick}
			className={styles.resultsEntry}
			onMouseEnter={() => onHoverState(true)}
			onMouseLeave={() => onHoverState(false)}
		>
			{icon && <img src={icon} />}
			<p style={{ fontWeight: "bold" }}>{title}</p>
			<p style={{ opacity: "0.6" }}>{ticker}</p>
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

				const res = await execute(SearchDocument, query);
				const data: SearchQuery = res.data ?? {
					ideaPropSearch: [],
				};

				setSearchResults(
					data.ideaPropSearch.map((info) => (
						<SearchEntry
							key={info.id}
							addr={info.id}
							ticker={info.ticker}
							title={info.name}
							term={e.target.value.toLocaleLowerCase()}
							onClick={() => selected(info.id)}
							onHoverState={(state: boolean) => {
								if (state) {
									hovered(info.id);

									return;
								}

								dehovered(info.id);
							}}
						/>
					))
				);
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
