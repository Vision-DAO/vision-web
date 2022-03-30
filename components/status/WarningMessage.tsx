import WarningIcon from "@mui/icons-material/Warning";
import styles from "./WarningMessage.module.css";

/**
 * A component displaying a warning message with a warning icon and the given
 * text information.
 */
export const WarningMessage = ({ title, message }: { title: string, message: string }) => {
	return (
		<div className={ styles.warningContainer }>
			<WarningIcon fontSize="large" />
			<h1>{ title }</h1>
			<p>{ message }</p>
		</div>
	);
};
