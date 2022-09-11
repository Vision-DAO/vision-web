import { VisionaryBubble } from "./VisionaryBubble";
import winStyles from "./IdeaPreviewWindow.module.css";
import styles from "./VisionaryListDisplay.module.css";
import { useState, useEffect, useRef } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { GetDaoAboutQuery } from "../../../../.graphclient";
import { useUserName } from "../../../../lib/util/ipfs";
import { formatErc, zAddr, useRegistry } from "../../../../lib/util/networks";
import Link from "next/link";

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
export const VisionaryListDisplay = ({
	idea,
}: {
	idea: GetDaoAboutQuery["idea"];
}) => {
	const reg = useRegistry();
	const state: listState = idea.users
		.filter(
			({ id }) =>
				![
					`g${zAddr}:${idea.id}`,
					`g${idea.id}:${idea.id}`,
					`g${reg}:${idea.id}`,
				].includes(id)
		)
		.reduce(
			(accum, user) => {
				return {
					visionaries: {
						[user.user.id]: user.tokens.balance,
						...accum.visionaries,
					},
					visionaryCount: accum.visionaryCount + 1,
				};
			},
			{ visionaries: {}, visionaryCount: 0 }
		);
	const [selectedVisionary, setSelectedVisionary] = useState<string>(null);
	const visionaryName = useUserName(selectedVisionary);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);
	const canvasRef = useRef(null);

	useEffect(() => {
		if (
			canvasRef !== null &&
			canvasRef.current !== null &&
			canvasHeight === 0
		) {
			setCanvasHeight(canvasRef.current.clientHeight);
		}
	}, [window.innerHeight, window.innerWidth]);

	return (
		<div className={`${winStyles.prevWindow} ${styles.visionaryWindow}`}>
			<h2 className={winStyles.prevWindowHeader}>Visionaries</h2>
			{state === null || state === undefined ? (
				<div className={styles.loadingContainer}>
					<CircularProgress />
				</div>
			) : (
				<div className={styles.listDisplayContainer}>
					<div className={styles.textListInfo}>
						<div className={styles.listItem}>
							<p>Total</p>
							<p>{state.visionaryCount}</p>
						</div>
						{selectedVisionary && (
							<div className={styles.activeVisionaryInfo}>
								<Link href={`/profile/${selectedVisionary}`}>
									<a className={styles.visionaryName}>
										{visionaryName ?? selectedVisionary}
									</a>
								</Link>
								<div className={styles.listItem}>
									<p>Stake</p>
									<p>
										<b>
											{Math.round(
												(state.visionaries[selectedVisionary] /
													Number(idea.supply)) *
													10000
											) / 100}
											%
										</b>
									</p>
								</div>
								<div className={styles.listItem}>
									<p>Tokens</p>
									<p>
										<b>{formatErc(state.visionaries[selectedVisionary])}</b>
									</p>
								</div>
							</div>
						)}
					</div>
					<div className={styles.bubblesPool} ref={canvasRef}>
						{Object.entries(state.visionaries)
							.sort(([, balanceA], [, balanceB]) => balanceA - balanceB)
							.map(([visionary, balance]) => {
								return (
									<VisionaryBubble
										seed={visionary}
										onClick={() => setSelectedVisionary(visionary)}
										size={canvasHeight * (balance / Number(idea.supply))}
										active={selectedVisionary === visionary}
										key={visionary}
									/>
								);
							})}
					</div>
				</div>
			)}
		</div>
	);
};
