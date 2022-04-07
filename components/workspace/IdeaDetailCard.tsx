import { IdeaBubbleProps } from "./IdeaBubble";
import styles from "./IdeaDetailCard.module.css";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, useEffect } from "react";

const InfoItem = ({ left, right, key = left }: { left: string, right: JSX.Element, key?: string }) => {
	return (
		<div className={ styles.infoLine } key={ key }>
			<p>{ left }</p>
			{ right }
		</div>
	);
};

const Metric = ({ val, label, isPercent = false }: { val: number, label: string, isPercent?: boolean }) => {
	// Metrics are displayed as relative changes, and must have a
	// corresponding prefix to indicate positive or negative change
	let prefix = "";

	// Absolute values should not have a % suffix
	const suffix = isPercent ? "%" : "";
	let directionStyles = "";

	if (val > 0) {
		prefix = "+";

		directionStyles = ` ${ styles.posValueMetric }`;
	} else if (val < 0) {
		prefix = "-";

		directionStyles = ` ${ styles.negValueMetric }`;
	}

	return (
		<div className={ styles.metric } key={ label }>
			<p className={ `${ styles.metricValue }${ directionStyles }` }>{ `${prefix}${val}${suffix}` }</p>
			<p>{ label }</p>
		</div>
	);
};

export interface OnlyIdeaDetailProps {
	marketCap: number;
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

/**
 * Extended metadata required, and optional, for displaying an Idea's card
 * information.
 */
export interface IdeaDetailProps {
	content?: IdeaBubbleProps & OnlyIdeaDetailProps & MarketMetrics;
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
	const rootStyles = loaded ? styles.cardContainer : `${ styles.cardContainer } ${ styles.invisible }`;

	useEffect(() => {
		if (!loaded)
			setLoaded(true);
	});

	const close = () => {
		setLoaded(false);

		//setTimeout(onClose, 300);
	};

	// Display a loading indicator if the item hasn't loaded in yet
	if (!content) {
		return (
			<div className={ rootStyles }>
				<div className={ styles.cardTitleInfo }>
					<div className={ styles.cardMainTitle }>
						<h1 className={ styles.cardTitle }>Idea Details</h1>
						<CloseRounded className={ styles.closeButton } onClick={ close }/>
					</div>
				</div>
				<div className={ styles.cardLoading }>
					<CircularProgress />
				</div>
			</div>
		);
	}

	const { title, ticker, description, totalSupply, addr, explorerURI, createdAt, nChildren, price, marketCap, newProposals, deltaPrice, finalizedProposals } = content;

	// Items displayed under the info header, as shown on the figma. See TODO
	const info = {
		"Market cap": <p>{ `${marketCap.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Last price": <p>{ `${price.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Total supply": <p>{ totalSupply }</p>,
		"Contract": <p><a href={ `${explorerURI}/address/${addr}` }>{ addr }</a></p>,
		"Child projects": <p>{ nChildren }</p>,
		"Date created": <p>{ `${createdAt.getMonth()}/${createdAt.getDay()}/${createdAt.getFullYear()}` }</p>
	};

	// Items also have less detailed metrics for the last 24 hours.
	// See above prop definition
	const metricsDay = {
		"Proposals": newProposals,
		"Last Price": deltaPrice,
		"Finalized Proposals": finalizedProposals,
	};

	return (
		<div className={ rootStyles }>
			<div className={ styles.cardTitleInfo }>
				<div className={ styles.cardMainTitle }>
					<h1 className={ styles.cardTitle }>Idea Details</h1>
					<CloseRounded onClick={ onClose }/>
				</div>
				<h2>{ title } ({ ticker })</h2>
				{ description && <p>{ description }</p> }
			</div>
			<div>
				<h2>Info</h2>
				{ Object.entries(info).map(([key, value]) => InfoItem({ left: key, right: value })) }
			</div>
			<div>
				<h2>Last 24h.</h2>
				<div className={ styles.cardMetrics }>
					{ Object.entries(metricsDay).map(([key, value]) => <Metric key={ key } val={ value } label={ key } isPercent={ key == "Last Price" }/> ) }
				</div>
			</div>
		</div>
	);
};
