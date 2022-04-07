import { IdeaBubbleProps } from "./IdeaBubble";

const InfoItem = ({ left, right, key = left }: { left: string, right: JSX.Element, key?: string }) => {
	return (
		<div key={ key }>
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

	if (val > 0)
		prefix = "+";
	else if (val < 0)
		prefix = "-";

	return (
		<div key={ label }>
			<p>{ `${prefix}${val}${suffix}` }</p>
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
export type IdeaDetailProps = IdeaBubbleProps & OnlyIdeaDetailProps & MarketMetrics;

/**
 * A component rendering a closeable, triggerable card with basic information
 * about an idea on it.
 *
 * TODO: Market info (market cap, last price)
 */
export const IdeaDetailCard = ({ title, ticker, description, totalSupply, addr, explorerURI, createdAt, nChildren, price, marketCap, newProposals, deltaPrice, finalizedProposals }: IdeaDetailProps) => {
	// Items displayed under the info header, as shown on the figma. See TODO
	const info = {
		"Market cap": <p>{ `${marketCap.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Last price": <p>{ `${price.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Total supply": <p>{ totalSupply }</p>,
		"Contract": <p><a href={ `${explorerURI}/address/${addr}` }>{ addr }</a></p>,
		"Child projects": <p>{ nChildren }</p>,
		"Date created": <p>{ `${createdAt.getMonth()}${createdAt.getDay()}${createdAt.getFullYear()}` }</p>
	};

	// Items also have less detailed metrics for the last 24 hours.
	// See above prop definition
	const metricsDay = {
		"Proposals": newProposals,
		"Last Price": deltaPrice,
		"Finalized Proposals": finalizedProposals,
	};

	return (
		<div>
			<div>
				<h1>Idea Details</h1>
				<h1>{ title } ({ ticker })</h1>
				{ description && <p>{ description }</p> }
			</div>
			<div>
				<h1>Info</h1>
				{ Object.entries(info).map(([key, value]) => InfoItem({ left: key, right: value })) }
			</div>
			<div>
				<h1>Last 24h.</h1>
				{ Object.entries(metricsDay).map(([key, value]) => <Metric key={ key } val={ value } label={ key } isPercent={ key == "Last Price" }/> ) }
			</div>
		</div>
	);
};
