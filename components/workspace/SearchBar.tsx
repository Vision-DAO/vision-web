import { useState, ChangeEvent, FocusEvent } from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import styles from "./SearchBar.module.css";

const defaultSearchText = "\"The next big thing\"";

/**
 * A component that renders an input and a list of filtered results matching
 * the input criteria below it.
 */
export const SearchBar = () => {
	const [searchText, setSearchText] = useState<string>(defaultSearchText);
	const [searchResults, setSearchResults] = useState<string[]>([]);

	// Recalculate the displayed query results
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchText(e.target.value);
		setSearchResults(e.target.value.split(" ").filter((elem) => elem.length > 0));
	};

	const handleExit = (e: FocusEvent<HTMLInputElement>) => {
		if (e.target.value.length === 0) {
			setSearchText(defaultSearchText);
			setSearchResults([]);
		}
	};

	return (
		<div className={ styles.searchBarContainer }>
			<div className={ styles.queryArea }>
				<SearchRounded />
				<input type="text" value={ searchText } onClick={ () => setSearchText("") } onChange={ handleChange } onBlur={ handleExit } />
			</div>
			<div className={ styles.resultsArea }>
				{ searchResults.map((result) => <p key={ result }>{ result }</p>) }
			</div>
		</div>
	);
};
