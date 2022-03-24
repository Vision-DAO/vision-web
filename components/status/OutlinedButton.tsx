import styles from "./OutlinedButton.module.css";
import React from "react";

export interface ButtonProps {
	callback: () => void,
}

/**
 * A button with 3ID branding that allows the user to click, with a callback.
 */
export const OutlinedButton: React.FC<ButtonProps> = ({ callback, children }) => {
	return (
		<div className={styles.outlinedButton} onClick={callback}>
			{ children }
		</div>
	);
};

export default OutlinedButton;
