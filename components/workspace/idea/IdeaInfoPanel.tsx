import styles from "../IdeaDetailCard.module.css";
import { ExtendedIdeaInformation } from "../IdeaDetailCard";
import { OutlinedButton } from "../../status/OutlinedButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useViewerRecord } from "@self.id/framework";
import { useState } from "react";
import { unwatchIdea, watchIdea } from "../../../lib/util/discovery.ts";

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

const WatchIdeaButton = (ideaAddr: string) => {

	const watchingRecord = useViewerRecord<ModelTypes>("visionWatchedItemAddressesList");
	const [watched, setWatched] = useState(() => {
		const itemArr = watchingRecord.content?.items;
		console.log(watchingRecord);
		for(let i = 0; i < itemArr?.length ?? 0; i++) {
			console.log(itemArr[i], ideaAddr);
			if(itemArr[i].ideaAddr == ideaAddr.ideaAddr) {
				return true;
			}
		}
		return false;
	});


	const watchIdeaCallback = () => {
		if(watched) {
			setWatched(false);
			unwatchIdea(ideaAddr, watchingRecord);
		}

		setWatched(true);
		watchIdea(ideaAddr, watchingRecord);
	};

	return (
		<OutlinedButton callback={watchIdeaCallback}>
			{ watched ? <VisibilityIcon/> : <VisibilityOffIcon/> }
			&nbsp;&nbsp;
			{ watched ? "Unwatch" : "Watch" }
		</OutlinedButton>
	);
};

/**
 * The section of an Idea Card displaying actual information about the idea.
 * Excludes navigation items, including enter and buy buttons.
 */
export const IdeaInfoPanel = ({ idea }: { idea: ExtendedIdeaInformation }) => {
	// This is omega cringe LMAO
	const {
		title,
		description,
		ticker,
		newProposals,
		deltaPrice,
		finalizedProposals,
		marketCap,
		price,
		explorerURI,
		totalSupply,
		addr,
		nChildren,
		createdAt
	} = idea;

	// Items displayed under the info header, as shown on the figma. See TODO
	const info = {
		"Market cap": <p>{ `${marketCap.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Last price": <p>{ `${price.toLocaleString("en-US", { style: "currency", currency: "USD" })}` }</p>,
		"Total supply": <p>{ (totalSupply / (10 ** 18)).toLocaleString() }</p>,
		"Contract": <p><a href={ `${explorerURI}/address/${addr}` } target="_blank" rel="noopener noreferrer">{ addr }</a></p>,
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
		<div className={ styles.cardInfo }>
			<div className={ styles.cardTitleInfo }>
				<div>
					<h2>{ title } ({ ticker })</h2>
					{ description && <p>{ description }</p> }
				</div>
				<WatchIdeaButton ideaAddr={addr}/>
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
