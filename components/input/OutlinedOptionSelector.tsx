import styles from "./OutlinedOptionSelector.module.css";
import { useState } from "react";
import IndeterminateCheckBoxRounded from "@mui/icons-material/IndeterminateCheckBoxRounded";

/**
 * A horizontal, outlined input item that allows the user to select one of
 * multiple options.
 */
export const OutlinedOptionSelector = ({ options, activeOptions = new Set([]), onChange, onClear }: { options: string[], activeOptions?: Set<string>, onChange: (option: string) => void, onClear: (option: string) => void }) => {
	const [selected, setSelected] = useState("");

	return (
		<div className={ styles.outlinedSelector }>
			{
				options.map((option, i) =>
					<div
						key={ option }
						className={
							styles.selectorItem
							+ (i < options.length ? ` ${styles.middleItem}` : "" )
							+ (selected === option ? ` ${styles.selectedItem}` : "" )
						}
					>
						{ activeOptions.has(option) && <IndeterminateCheckBoxRounded onClick={ () => onClear(option) } /> }
						<p onClick={ () => { setSelected(option); onChange(option); } }>{ option }</p>
					</div>
				)
			}
		</div>
	);
};
