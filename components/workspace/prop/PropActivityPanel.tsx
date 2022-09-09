import { ConnStatus, formatErc } from "../../../lib/util/networks";
import { PropInfo } from "../../../lib/util/proposals/module";
import Prop from "../../../value-tree/build/contracts/Prop.json";
import { ProfileTooltip } from "../../status/ProfileTooltip";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import {
	ActivityEntryProps,
	ActivityEntry,
} from "../idea/activity/ActivityEntry";
import styles from "../idea/IdeaActivityPanel.module.css";
import TimelineIcon from "@mui/icons-material/Timeline";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * A panel in a proposal's about page that lists all of the recently available events for the idea.
 * This includes events for its parent contract that are relevant to the proposal.
 */
export const PropActivityPanel = ({ prop }: { prop: PropInfo }) => {
	const events: ActivityEntryProps[] = prop.votes.map((vote) => {
		return {
			key: vote.id,
			kind: "VoteCast",
			label: (
				<div className={styles.row}>
					<ProfileTooltip addr={vote.voter.user.id} />
					<p style={{ marginLeft: "0.25em" }}>
						voted <b>{vote.kind.toLowerCase()}</b> the proposal with{" "}
						{formatErc(Number(vote.votes))} {prop.funder.ticker}
					</p>
				</div>
			),
			timestamp: new Date(Number(vote.createdAt) * 1000),
		};
	});

	const expiration = new Date(Number(prop.expiration) * 1000);

	return (
		<div className={styles.activityPanelContainer}>
			<div className={styles.panelHeader}>
				<TimelineIcon />
				<h2>Activity</h2>
			</div>
			<div className={events ? styles.activityList : styles.loadingContainer}>
				{new Date() > expiration && prop.status !== "Accepted" ? (
					<ActivityEntry
						kind="ProposalRejected"
						timestamp={expiration}
						label={<p>Proposal Rejected: {prop.title}</p>}
					/>
				) : (
					prop.finalizedAt && (
						<ActivityEntry
							kind="ProposalAccepted"
							timestamp={new Date(Number(prop.finalizedAt) * 1000)}
							label={<p>Proposal Accepted: {prop.title}</p>}
						/>
					)
				)}
				{events ? (
					events.map((e) => {
						return ActivityEntry({ ...e });
					})
				) : (
					<CircularProgress />
				)}
				<ActivityEntry
					kind="NewProposal"
					timestamp={new Date(Number(prop.createdAt) * 1000)}
					label={<p>Proposal Recorded: {prop.title}</p>}
				/>
			</div>
		</div>
	);
};
