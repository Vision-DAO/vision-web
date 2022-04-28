import styles from "./IdeaActivityPanel.module.css";
import TimelineIcon from "@mui/icons-material/Timeline";
import { ActivityEntry, ActivityEntryProps, icons } from "./activity/ActivityEntry";
import { ExtendedIdeaInformation } from "../IdeaDetailCard";
import { useState, useEffect } from "react";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import Web3 from "web3";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * A panel in an idea's about page that lists all of the recently available events for the idea.
 */
export const IdeaActivityPanel = ({ web3, idea }: { web3: Web3, idea: ExtendedIdeaInformation }) => {
	// Get a reference to the contract to look through relevant logs
	const contract = new web3.eth.Contract(Idea.abi, idea.addr);
	const [events, setEvents] = useState<ActivityEntryProps[]>(undefined);

	useEffect(() => {
		// Load the events for the idea
		if (events === undefined) {
			// Obtain a lock on the events
			setEvents(null);

			// Collect all relevant logs, format them for displaying
			(async () => {
				// TODO: Find a way to filter logs from even further (might require self-hosting)
				const ideaLogs = await Promise.all((await contract.getPastEvents("allEvents",
					{ fromBlock: (await web3.eth.getBlockNumber()) - 500, toBlock: "latest" }
				))
					.filter((e) => { return e !== undefined && e !== null && e.event && (e.event in icons); })
					.map((e) => {
						// Use a default label for items that don't have an accepted format
						let label = "";

						switch (e.event) {
						case "IdeaRecorded":
							label = `${idea.title}: ${idea.description}`;

							break;
						case "IdeaFunded":
						case "FundingDispersed":
							// TODO: Render this two separate ways
							// - Display etherscan
							// or, - display a link to a vision page with the idea
							label = `${e.raw.topics[0]}`;

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

				setEvents(ideaLogs);
			})();
		}
	});

	return (
		<div className={ styles.activityPanelContainer }>
			<div className={ styles.panelHeader }>
				<TimelineIcon />
				<h2>Activity</h2>
			</div>
			<div className={ styles.activityList }>
				{ events ?
					events.map((e) => {
						return ActivityEntry(e);
					}) : <CircularProgress />
				}
			</div>
		</div>
	);
};
