import WarningIcon from "@mui/icons-material/Warning";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./WarningMessage.module.css";

/**
 * A component displaying a warning message with a warning icon and the given
 * text information.
 */
export const WarningMessage = ({ title, message, loading = false }: { title: string, message: string, loading?: boolean }) => {
	return (
		<div className={ styles.warningContainer }>
			<WarningIcon fontSize="large" />
			<h1>{ title }</h1>
			<p>{ message }</p>
			{ loading && <LinearProgress sx={{ color: "white" }} /> }
		</div>
	);
};
