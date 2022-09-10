import { useState } from "react";
import styles from "./Dropdown.module.css";
import DropdownIcon from "@mui/icons-material/ArrowDropDownRounded";

/**
 * Allows the user to select one option out of multiple.
 */
export const Dropdown = ({
	options,
	onChange,
}: {
	options: string[];
	onChange: (option: string) => void;
}) => {
	const [currOption, setCurrOptionValue] = useState<string>(options[0]);
	const [open, setOpen] = useState<boolean>(false);

	const setCurrOption = (option: string) => {
		setCurrOptionValue(option);
		onChange(option);
	};

	return (
		<div
			className={`${styles.optionContainer} ${
				open ? styles.expanded : undefined
			}`}
		>
			<div
				className={styles.selectedOption}
				onClick={() => setOpen((open) => !open)}
			>
				<DropdownIcon
					className={`${!open ? styles.down : styles.up} ${styles.rotatable}`}
					fontSize="small"
				/>
				<p>{currOption}</p>
			</div>
			{open &&
				options
					.filter((option) => option !== currOption)
					.map((elem) => (
						<p
							className={styles.option}
							key={elem}
							onClick={() => setCurrOption(elem)}
						>
							{elem}
						</p>
					))}
		</div>
	);
};
