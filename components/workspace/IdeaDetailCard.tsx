import { BasicIdeaInformation } from "./IdeaBubble";
import styles from "./IdeaDetailCard.module.css";
import { IdeaInfoPanel } from "./idea/IdeaInfoPanel";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { FilledButton } from "../status/FilledButton";
import { IdeaData } from "../../lib/util/ipfs";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export interface OnlyIdeaDetailProps {
	description: string;
	data: IdeaData[];
	marketCap: number;
	totalSupply: number;
	ticker: string;
	price: number;
	explorerURI: string;
	createdAt: Date;
	nChildren: number;
}

/**
 * Metrics for the last 24 hours of an idea, including:
 * - How many new proposal were added
 * - How muh the price changed
 * - How many proposals were accepted
 */
export interface MarketMetrics {
	newProposals: number;
	deltaPrice: number;
	finalizedProposals: number;
}

export type ExtendedIdeaInformation = BasicIdeaInformation &
	OnlyIdeaDetailProps &
	MarketMetrics;

/**
 * Extended metadata required, and optional, for displaying an Idea's card
 * information.
 */
export interface IdeaDetailProps {
	content?: ExtendedIdeaInformation;
	onClose: () => void;
}

/**
 * A component rendering a closeable, triggerable card with basic information
 * about an idea on it.
 *
 * TODO: Market info (market cap, last price)
 */
export const IdeaDetailCard = ({ content, onClose }: IdeaDetailProps) => {
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
	if (!content) {
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

	const { title, addr } = content;

	return (
		<div className={rootStyles}>
			<div className={styles.cardMainTitle}>
				<h1 className={styles.cardTitle}>Idea Details</h1>
				<CloseRounded onClick={close} />
			</div>
			<IdeaInfoPanel idea={content} />
			<div className={styles.cardActions}>
				<FilledButton
					label="Enter Community"
					className={styles.goButton}
					onClick={() => router.push(`/ideas/${addr}/about`)}
				/>
				<FilledButton className={styles.buyButton} label={`Buy ${title}`} />
			</div>
		</div>
	);
};
