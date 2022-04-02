import WarningIcon from "@mui/icons-material/Warning";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./WarningMessage.module.css";

/**
 * A component displaying a warning message with a warning icon and the given
 * text information.
 */
export const WarningMessage = ({ title, message, loading = false }: { title: string, message: string, loading?: boolean }) => {
	let progress = null;

	if (loading)
		progress = <LinearProgress sx={{ width: "100%" }} color="inherit" />;

	return (
		<div className={ styles.warningContainer }>
			<WarningIcon fontSize="large" />
			<h1>{ title }</h1>
			<p>{ message }</p>
			{ progress }
		</div>
	);
};
