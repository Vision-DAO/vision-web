import styles from "./OutlinedButton.module.css";
import React from "react";

export interface ButtonProps {
	callback: () => void;
	severity?: "info" | "action" | "error";
}

/**
 * A button with 3ID branding that allows the user to click, with a callback.
 */
export const OutlinedButton: React.FC<ButtonProps> = ({ callback, severity = "info", children }) => {
	let styling = "";

	switch (severity) {
	case "action":
		styling = " " + styles.action;

		break;
	case "error":
		styling = " " + styles.error;

		break;
	}

	return (
		<div className={ `${styles.outlinedButton + styling}` } onClick={callback}>
			{ children }
		</div>
	);
};

export default OutlinedButton;
