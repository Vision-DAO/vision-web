import { ExtendedIdeaInformation } from "../../IdeaDetailCard";
import { useWeb3 } from "../../../../lib/util/web3";
import { VisionaryBubble } from "./VisionaryBubble";
import Idea from "../../../../value-tree/build/contracts/Idea.json";
import winStyles from "./IdeaPreviewWindow.module.css";
import styles from "./VisionaryListDisplay.module.css";
import { useState, useEffect, useRef } from "react";
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
	const [selectedVisionary, setSelectedVisionary] = useState<string>(null);
	const [biggestVisionary, setBiggestVisionary] = useState<number>(1);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);
	const canvasRef = useRef(null);

	useEffect(() => {
		if (canvasRef !== null && canvasRef.current !== null && canvasHeight === 0) {
			setCanvasHeight(canvasRef.current.clientHeight);
		}
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

				const holders = new Set(logs.map((log) => log.returnValues[1]));

				// Load each of the balances of the holders of the token
				const withBalances: { [holder: string]: number } = await Promise.all(
					[...holders].map(async (holder) => {
						return [holder, await contract.methods.balanceOf(holder).call()];
					}))
					.then((balances) =>
						balances.reduce((accum: { [holder: string]: number }, [holder, balance]) =>
						{
							return { ...accum, [holder]: balance };
						}, {})
					);

				let largest = biggestVisionary;

				Object.values(withBalances)
					.forEach((balance) => {
						if (balance > largest)
							largest = balance;
					});

				if (largest > biggestVisionary)
					setBiggestVisionary(largest);

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
					<div className={ styles.textListInfo }>
						<div className={ styles.listItem }>
							<p>Total</p>
							<p>{ state.visionaryCount }</p>
						</div>
						{ selectedVisionary &&
							<div className={ styles.activeVisionaryInfo }>
								<p className={ styles.visionaryName }>{ selectedVisionary }</p>
								<div className={ styles.listItem }>
									<p>Stake</p>
									<p><b>{ state.visionaries[selectedVisionary] / idea.totalSupply * 100 }%</b></p>
								</div>
								<div className={ styles.listItem }>
									<p>Tokens</p>
									<p><b>{ state.visionaries[selectedVisionary] }</b></p>
								</div>
							</div>
						}
					</div>
					<div className={ styles.bubblesPool } ref={ canvasRef }>
						{ Object.entries(state.visionaries)
							.sort(([, balanceA], [, balanceB]) => balanceA - balanceB)
							.map(([visionary, balance]) => {
								return (
									<VisionaryBubble
										seed={ visionary }
										onClick={ () => setSelectedVisionary(visionary) }
										size={ canvasHeight * (balance / idea.totalSupply) }
										active={ selectedVisionary === visionary }
										key={ visionary }
									/>
								);
							})
						}
					</div>
				</div>
			}
		</div>
	);
};
