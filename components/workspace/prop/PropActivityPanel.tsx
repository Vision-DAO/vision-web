import { ExtendedProposalInformation } from "../../../lib/util/ipfs";
import { resolveIdeaName } from "../../../lib/util/discovery";
import { ConnStatus } from "../../../lib/util/networks";
import Prop from "../../../value-tree/build/contracts/Prop.json";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import { ActivityEntryProps, ActivityEntry } from "../idea/activity/ActivityEntry";
import { useEffect, useState } from "react";
import styles from "../idea/IdeaActivityPanel.module.css";
import TimelineIcon from "@mui/icons-material/Timeline";
import CircularProgress from "@mui/material/CircularProgress";
import Web3 from "web3";

/**
 * A panel in a proposal's about page that lists all of the recently available events for the idea.
 * This includes events for its parent contract that are relevant to the proposal.
 */
export const PropActivityPanel = ({ web3, conn, prop }: { web3: Web3, conn: ConnStatus, prop: ExtendedProposalInformation }) => {
	const contract = new web3.eth.Contract(Prop.abi, prop.address);
	const ideaContract = new web3.eth.Contract(Idea.abi, prop.parentAddr);
	const [events, setEvents] = useState<ActivityEntryProps[]>(undefined);

	useEffect(() => {
		// Load the events
		if (events === undefined) {
			// Obtain a lock
			setEvents(null);

			(async () => {
				// TODO: Gossip this information as well, AND increase the archival period
				const parentLogs = await ideaContract.getPastEvents("IdeaFunded", { fromBlock: (await web3.eth.getBlockNumber()) - 500, toBlock: "latest" });
				const propLogs = await contract.getPastEvents("allEvents", { fromBlock: (await web3.eth.getBlockNumber()) - 500, toBlock: "latest" } );

				// The name of the thing to be funded
				const childName = await resolveIdeaName(web3, conn, prop.destAddr);

				// Do not include null entries
				// Do not include entries for parent proposals that aren't this one
				const events = await Promise.all([...parentLogs, ...propLogs]
					.filter((e) => e !== undefined && e !== null && e.event)
					.filter((e) => e.event === "NewProposal" || e.raw.topics[0] === prop.address)
					.map((e) => {
						// Use an empty label for unrecognized events
						let label = "";

						switch (e.event) {
						case "NewProposal":
							label = `${prop.title}: Fund ${childName}`;

							break;
						case "IdeaFunded":
							label = `${prop.title} Accepted: Funded ${childName}`;

							break;
						}

						return (async () => {
							const eventBlock = await web3.eth.getBlock(e.blockNumber);

							return {
								kind: e.event,
								label: label,
								timestamp: new Date(eventBlock.timestamp as number * 1000),
							};
						})();
					}));

				setEvents(events);
			})();
		}

		// The proposal has closed for voting but the event isn't listed
		if (events && new Date() > prop.expiry && events.filter(({ kind }) => kind === "ProposalClosed").length === 0) {
			setEvents(events => [
				...events,
				{
					kind: "ProposalClosed",
					label: `${prop.title}: Voting Closed`,
					timestamp: prop.expiry 
				}
			]);
		}
	});

	return (
		<div className={ styles.activityPanelContainer }>
			<div className={ styles.panelHeader }>
				<TimelineIcon />
				<h2>Activity</h2>
			</div>
			<div className={ events ? styles.activityList : styles.loadingContainer }>
				{ events ?
					events.map((e) => {
						return ActivityEntry({ key: e.label, ...e });
					}) : <CircularProgress />
				}
			</div>
		</div>
	);
};
