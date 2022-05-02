import styles from "./ActivityEntry.module.css";
import { ReactElement } from "react";
import SaveIcon from "@mui/icons-material/Save";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import { OutlinedListEntry } from "../../../status/OutlinedListEntry";

// Icons to render for each kind of event
export const icons: { [kind: string]: ReactElement } = {
	"IdeaRecorded": <SaveIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />,
	"IdeaFunded": <MoneyIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />,
	"FundingDispersed": <PriceCheckIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />,
};

const properLabels = {
	"IdeaRecorded": "Idea Recorded",
	"IdeaFunded": "Idea Funded",
	"FundingDispersed": "Funding Dispersed",
};

export interface ActivityEntryProps {
	kind: string;
	label: string;
	timestamp: Date;
}

const formatTime12Hr = (time: Date): string => {
	const hoursPast = time.getHours() % 12;

	return `${hoursPast === 0 ? 12 : hoursPast}:${time.getMinutes()} ${time.getHours() < 12 ? "AM" : "PM"}`;
};

/**
 * A row in the activity view for an Idea's about page.
 */
export const ActivityEntry = ({ key, kind, label, timestamp }: { key?: string, kind: string, label: string, timestamp: Date }) => {
	return (
		<OutlinedListEntry key={ key }>
			<div className= {styles.eventKindLabel }>
				{ icons[kind] }
				<p>{ properLabels[kind] }</p>
			</div>
			<p>&quot;{ label }&quot;</p>
			<p>{ formatTime12Hr(timestamp) }</p>
		</OutlinedListEntry>
	);
};