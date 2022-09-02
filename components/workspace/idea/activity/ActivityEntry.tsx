import styles from "./ActivityEntry.module.css";
import { ReactElement } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import SaveIcon from "@mui/icons-material/Save";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import { OutlinedListEntry } from "../../../status/OutlinedListEntry";

// Icons to render for each kind of event
export const icons: { [kind: string]: ReactElement } = {
	IdeaRecorded: <SaveIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />,
	NewProposal: (
		<CampaignRoundedIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />
	),
	ProposalAccepted: (
		<CheckRoundedIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />
	),
	ProposalRejected: (
		<ClearRoundedIcon fontSize="large" sx={{ opacity: 0.7, zIndex: 1 }} />
	),
};

const properLabels = {
	IdeaRecorded: "Idea Recorded",
	ProposalAccepted: "Proposal Accepted",
	ProposalRejected: "Proposal Rejected",
	NewProposal: "New Proposal",
};

export interface ActivityEntryProps {
	kind: string;
	label: string;
	timestamp: Date;
}

export const formatTime12Hr = (time: Date): string => {
	const hoursPast = time.getHours() % 12;

	return `${hoursPast === 0 ? 12 : hoursPast}:${
		time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes()
	} ${time.getHours() < 12 ? "AM" : "PM"}`;
};

/**
 * A row in the activity view for an Idea's about page.
 */
export const ActivityEntry = ({
	key,
	kind,
	label,
	timestamp,
}: {
	key?: string;
	kind: string;
	label: string;
	timestamp: Date;
}) => {
	return (
		<OutlinedListEntry key={key}>
			<div className={styles.eventKindLabel}>
				{icons[kind]}
				<p>{properLabels[kind]}</p>
			</div>
			<p>{label}</p>
			<p>{formatTime12Hr(timestamp)}</p>
		</OutlinedListEntry>
	);
};
