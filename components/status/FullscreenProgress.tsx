import { CircularProgress } from "@mui/material";

/**
 * Renders a circular progress bar filling the entire parent div.
 */
export const FullscreenProgress = () => {
	return (
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexFlow: "row nowrap",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<CircularProgress />
		</div>
	);
};
