import { ExtendedIdeaInformation } from "../../IdeaDetailCard";
import { useWeb3 } from "../../../../lib/util/web3";
import Idea from "../../../../value-tree/build/contracts/Idea.json";
import winStyles from "./IdeaPreviewWindow.module.css";
import styles from "./VisionaryListDisplay.module.css";
import { useState, useEffect } from "react";
import CircularProgress from "@mui/material/CircularProgress";

interface listState {
	/* The number of visionaries */
	visionaryCount: number;

	/* Addresses of all the visionaries holding the token, and the number of
	 * tokens they hold. TODO: Scan event logs to determine number of contributed
	 * proposals.
	 */
	visionaries: { [visionary: string]: number };
}

/**
 * Displays the number of unique token holders for the idea,
 * and some of the most prominent visionaries.
 */
export const VisionaryListDisplay = ({ idea }: { idea: ExtendedIdeaInformation }) => {
	const [web3, ] = useWeb3();
	const contract = new web3.eth.Contract(Idea.abi, idea.addr);

	const [state, setState] = useState<listState>(undefined);

	useEffect(() => {
		// The visionary info should only be loaded once
		if (state === undefined) {
			// Trigger rendering
			setState(null);

			// Look through the logs for the token's contract, and find the 5 biggest whales
			(async () => {
				const logs = await contract.getPastEvents(
					"Transfer",
					{ fromBlock: (await web3.eth.getBlockNumber()) - 500, toBlock: "latest" }
				);

				const holders = new Set(...logs.map((log) => log.returnValues[1]));

				// Load each of the balances of the holders of the token
				const withBalances: { [holder: string]: number } = await Promise.all(
					[...holders].map(async (holder) => {
						return [holder, await contract.methods.balanceOf().call(holder)];
					}))
					.then((balances) =>
						balances.reduce((accum: { [holder: string]: number }, [holder, balance]) =>
						{
							return { ...accum, [holder]: balance };
						}, {})
					);

				console.log(withBalances);

				setState(() => { return { visionaryCount: holders.size, visionaries: withBalances }; });
			})();
		}
	});

	return (
		<div className={ `${winStyles.prevWindow} ${styles.visionaryWindow}` }>
			<h2 className={ winStyles.prevWindowHeader }>Visionaries</h2>
			{ state === null || state === undefined ?
				<div className={ styles.loadingContainer }>
					<CircularProgress /> 
				</div> : 
				<div className={ styles.listDisplayContainer }>
				</div>
			}
		</div>
	);
};
