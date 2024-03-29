import styles from "./FilledButton.module.css";
import { ReactElement } from "react";

/**
 * A button with no rounded corners, and wih the primary color as its
 * background.
 */
export const FilledButton = ({
	children = [],
	label,
	onClick,
	className = "",
}: {
	label?: string;
	onClick?: () => void;
	className?: string;
	children?: ReactElement[];
}) => {
	return (
		<div
			className={
				(!onClick ? styles.pseudoButton : styles.filledButton) + " " + className
			}
			onClick={onClick ?? Function.prototype}
		>
			{label && <h1>{label}</h1>}
			{children}
		</div>
	);
};
