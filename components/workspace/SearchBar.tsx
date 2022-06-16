import { useState, ChangeEvent, FocusEvent } from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ExpandMore from "@mui/icons-material/ExpandMoreRounded";
import ExpandLess from "@mui/icons-material/ExpandLessRounded";
import styles from "./SearchBar.module.css";

const defaultSearchText = "\"The next big thing\"";

/**
 * A component that renders an input and a list of filtered results matching
 * the input criteria below it.
 */
export const SearchBar = () => {
	const [searchText, setSearchText] = useState<string>(defaultSearchText);
	const [searchResults, setSearchResults] = useState<string[]>([]);

	// The search bar can be minimized
	const [expanded, setExpanded] = useState<boolean>(true);

	// Recalculate the displayed query results
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setExpanded(true);
		setSearchText(e.target.value);
		setSearchResults(e.target.value.split(" ").filter((elem) => elem.length > 0));
	};

	const handleExit = (e: FocusEvent<HTMLInputElement>) => {
		if (e.target.value.length === 0) {
			setSearchText(defaultSearchText);
			setSearchResults([]);
		}
	};

	// Toggles the expansion state
	const handleExpand = () => setExpanded(expanded => !expanded);

	return (
		<div className={ styles.searchBarContainer }>
			<div className={ `${styles.queryArea} ${styles.searchContent}` }>
				<SearchRounded />
				<input type="text" value={ searchText } onClick={ () => setSearchText("") } onChange={ handleChange } onBlur={ handleExit } />
			</div>
			{ expanded &&
				<div className={ `${styles.resultsArea} ${styles.searchContent}` }>
					{ searchResults.map((result) => <p key={ result }>{ result }</p>) }
				</div>
			}
			{ searchResults.length > 0 &&
				<div className={ styles.expansionTab } onClick={ handleExpand }>
					{ expanded ? <ExpandMore /> : <ExpandLess /> }
				</div>
			}
		</div>
	);
};
