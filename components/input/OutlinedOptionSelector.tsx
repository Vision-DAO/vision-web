import styles from "./OutlinedOptionSelector.module.css";
import { useState } from "react";

/**
 * A horizontal, outlined input item that allows the user to select one of
 * multiple options.
 */
export const OutlinedOptionSelector = ({ options, onChange }: { options: string[], onChange: (option: string) => void }) => {
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
						onClick={ () => { setSelected(option); onChange(option); } }
					>
						<p>{ option }</p>
					</div>
				)
			}
		</div>
	);
};
