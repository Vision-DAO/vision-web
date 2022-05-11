import styles from "./IdeaActivityPanel.module.css";
import { resolveIdeaName } from "../../../lib/util/discovery";
import { useConnStatus } from "../../../lib/util/networks";
import TimelineIcon from "@mui/icons-material/Timeline";
import { ActivityEntry, ActivityEntryProps, icons } from "./activity/ActivityEntry";
import { ExtendedIdeaInformation } from "../IdeaDetailCard";
import { AbiItem } from "web3-utils";
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
	const [conn, ] = useConnStatus();

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
							label = "";

							break;
						}

						return (async () => {
							// We only need the number of decimals for the token funding the proposal
							const erc20Abi: AbiItem[] = [
								{
									"constant": true,
									"inputs": [],
									"name": "symbol",
									"outputs": [
										{ "name": "", "type": "string" }
									],
									"payable": false,
									"stateMutability": "view",
									"type": "function"
								},
								{
									"constant": true,
									"inputs": [],
									"name": "decimals",
									"outputs": [
										{ "name": "", "type": "uint8" }
									],
									"payable": false,
									"stateMutability": "view",
									"type": "function"
								},
							];

							const getLabelFundingDispersed = async () => {
								const contract = new web3.eth.Contract(erc20Abi, e.returnValues.rate.token);

								return `${(Number(e.returnValues.rate.value) / (10 ** (await contract.methods.decimals().call()))).toLocaleString()} ${await contract.methods.symbol().call()} Sent to Idea ${await resolveIdeaName(web3, conn, e.returnValues.idea)}` ;
							};

							const eventBlock = await web3.eth.getBlock(e.blockNumber);

							return {
								kind: e.event,
								label: e.event === "FundingDispersed" ? await getLabelFundingDispersed() : label,
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
			<div className={ events ? styles.activityList : styles.loadingContainer }>
				{ events ?
					events.map((e) => {
						return ActivityEntry({ key: `${e.label} ${e.timestamp}`, ...e });
					}) : <CircularProgress />
				}
			</div>
		</div>
	);
};
