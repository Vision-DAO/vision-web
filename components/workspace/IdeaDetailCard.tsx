import styles from "./IdeaDetailCard.module.css";
import { GetDaoInfoQuery } from "../../.graphclient";
import { IdeaInfoPanel } from "./idea/IdeaInfoPanel";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { FilledButton } from "../status/FilledButton";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

/**
 * Extended metadata required, and optional, for displaying an Idea's card
 * information.
 */
export interface IdeaDetailProps {
	idea: GetDaoInfoQuery;
	onClose: () => void;
}

/**
 * A component rendering a closeable, triggerable card with basic information
 * about an idea on it.
 *
 * TODO: Market info (market cap, last price)
 */
export const IdeaDetailCard = ({ idea, onClose }: IdeaDetailProps) => {
	const [loaded, setLoaded] = useState(false);
	const [closed, setClosed] = useState(false);
	const rootStyles =
		loaded && !closed
			? styles.cardContainer
			: `${styles.cardContainer} ${styles.invisible}`;

	// An idea's basic information is shown on a card, but a card has a button
	// "Enter Community" that opens a standalone page with information about the
	// community
	const router = useRouter();

	useEffect(() => {
		if (!loaded && !closed) setLoaded(true);
	});

	const close = () => {
		setClosed(true);
		setLoaded(false);

		setTimeout(onClose, 300);
	};

	// Display a loading indicator if the item hasn't loaded in yet
	if (!idea.idea) {
		return (
			<div className={rootStyles}>
				<div className={styles.cardTitleInfo}>
					<div className={styles.cardMainTitle}>
						<h1 className={styles.cardTitle}>Idea Details</h1>
						<CloseRounded className={styles.closeButton} onClick={close} />
					</div>
				</div>
				<div className={styles.cardLoading}>
					<CircularProgress />
				</div>
			</div>
		);
	}

	const { name, id } = idea.idea;

	return (
		<div className={rootStyles}>
			<div className={styles.cardMainTitle}>
				<h1 className={styles.cardTitle}>Idea Details</h1>
				<CloseRounded onClick={close} />
			</div>
			<IdeaInfoPanel idea={idea.idea} />
			<div className={styles.cardActions}>
				<FilledButton
					label="Enter Community"
					className={styles.goButton}
					onClick={() => router.push(`/ideas/${id}/about`)}
				/>
				<FilledButton
					className={styles.buyButton}
					label={`Trade ${name}`}
					onClick={() => window.open("https://app.uniswap.org", "_blank")}
				/>
			</div>
		</div>
	);
};
