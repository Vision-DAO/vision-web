import styles from "./IdeaActivityPanel.module.css";
import TimelineIcon from "@mui/icons-material/Timeline";
import { ActivityEntry } from "./activity/ActivityEntry";
import CircularProgress from "@mui/material/CircularProgress";
import { GetDaoAboutQuery } from "../../../.graphclient";
import { formatErc } from "../../../lib/util/networks";
import Link from "next/link";

type Event =
	| GetDaoAboutQuery["idea"]["recentAccepted"][0]
	| GetDaoAboutQuery["idea"]["recentCreated"][0]
	| GetDaoAboutQuery["idea"]["recentRejected"][0]
	| GetDaoAboutQuery["idea"]["recentTransfers"][0];

/**
 * A panel in an idea's about page that lists all of the recently available events for the idea.
 */
export const IdeaActivityPanel = ({
	idea,
}: {
	idea: GetDaoAboutQuery["idea"];
}) => {
	const dayStart = new Date();
	dayStart.setUTCHours(0, 0, 0, 0);

	const ideaCreatedAt = new Date(Number(idea.createdAt) * 1000);

	const transferSender = (
		e: GetDaoAboutQuery["idea"]["recentTransfers"][0]
	): { url: string; label: string } => {
		if ("sendUser" in e && e.sendUser)
			return { url: `/profile/${e.sendUser.id}`, label: e.sendUser.id };
		else if ("sendDao" in e && e.sendDao)
			return { url: `/ideas/${e.sendDao.id}/about`, label: e.sendDao.name };
	};

	const transferRecip = (
		e: GetDaoAboutQuery["idea"]["recentTransfers"][0]
	): { url: string; label: string } => {
		if ("recipUser" in e && e.recipUser !== null)
			return { url: `/profile/${e.recipUser.id}`, label: e.recipUser.id };
		else if ("recipDao" in e && e.recipDao !== null)
			return { url: `/ideas/${e.recipDao.id}/about`, label: e.recipDao.name };
	};

	const events = [
		...idea.recentAccepted,
		...idea.recentRejected,
		...idea.recentCreated,
		...idea.recentTransfers,
	]
		.map((e) => {
			let timestamp = new Date();
			let event = "NewProposal";
			let title = <p></p>;

			if ("finalizedAt" in e) {
				timestamp = new Date(Number(e.finalizedAt) * 1000);
				event =
					e.status === "Accepted" ? "ProposalAccepted" : "ProposalRejected";
			}

			if ("createdAt" in e) timestamp = new Date(Number(e.createdAt) * 1000);

			if ("title" in e) {
				title = <p>{e.title}</p>;
			} else if (
				"sendDao" in e ||
				"sendUser" ||
				"recipDao" in e ||
				"recipUser" in e
			) {
				const { url: sUrl, label: sLabel } = transferSender(e);
				const { url: rUrl, label: rLabel } = transferRecip(e);
				title = (
					<p>
						{formatErc(Number(e.value))} {idea.ticker} from{" "}
						<Link href={sUrl}>
							<a className={styles.actorLabel}>{sLabel}</a>
						</Link>{" "}
						to{" "}
						<Link href={rUrl}>
							<a className={styles.actorLabel}>{rLabel}</a>
						</Link>
					</p>
				);
				event = "Transfer";
			}

			return {
				kind: event,
				label: title,
				timestamp: timestamp,
			};
		})
		.sort(({ timestamp: a }, { timestamp: b }) => b.getTime() - a.getTime());

	// Make a synthetic event if the idea was created recently
	if (ideaCreatedAt > dayStart)
		events.push({
			kind: "IdeaRecorded",
			label: <p>{`Idea Recorded: ${idea.name}`}</p>,
			timestamp: ideaCreatedAt,
		});

	return (
		<div className={styles.activityPanelContainer}>
			<div className={styles.panelHeader}>
				<TimelineIcon />
				<h2>Activity</h2>
			</div>
			<div className={events ? styles.activityList : styles.loadingContainer}>
				{events ? (
					events.map((e) => {
						return ActivityEntry({ key: `${e.label} ${e.timestamp}`, ...e });
					})
				) : (
					<CircularProgress />
				)}
			</div>
		</div>
	);
};
