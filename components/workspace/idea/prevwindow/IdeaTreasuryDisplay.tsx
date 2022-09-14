import { GetDaoAboutQuery } from "../../../.graphclient";
import styles from "./VisionaryListDisplay.module.css";
import customStyles from "./IdeaTreasuryDisplay.module.css";
import { useVisAddr, formatErc } from "../../../../lib/util/networks";
import { useUserBalance } from "../../../../lib/util/ipfs";
import winStyles from "./IdeaPreviewWindow.module.css";
import { PieChart } from "react-minimal-pie-chart";
import { useState } from "react";
import Link from "next/link";

export const IdeaTreasuryDisplay = ({
	idea,
}: {
	idea: GetDaoAboutQuery["idea"];
}) => {
	const visToken = useVisAddr();
	const balance = useUserBalance(idea.id, visToken);
	const [selectedToken, setSelectedToken] = useState<number>(-1);
	const [hovered, setHovered] = useState<number>(-1);

	return (
		<div className={`${winStyles.prevWindow} ${styles.visionaryWindow}`}>
			<h2 className={winStyles.prevWindowHeader}>Treasury</h2>
			<div className={styles.listDisplayContainer}>
				<div className={styles.textListInfo}>
					<div className={customStyles.basicListInfo}>
						<div className={styles.listItem}>
							<p>
								<b>VIS</b>
							</p>
							<p>{formatErc(balance)}</p>
						</div>
						<div className={styles.listItem}>
							<p>Ideas Holding</p>
							<p>{idea.treasury.length}</p>
						</div>
					</div>
					{selectedToken !== -1 && (
						<div
							className={`${styles.activeVisionaryInfo} ${customStyles.advancedInfo}`}
						>
							<Link
								href={`/ideas/${idea.treasury[selectedToken].token.id}/about`}
							>
								<a className={styles.visionaryName}>
									{idea.treasury[selectedToken].token.name}
								</a>
							</Link>
							<div className={styles.listItem}>
								<p>Stake</p>
								<p>
									<b>
										{Math.round(
											(idea.treasury[selectedToken].balance /
												idea.treasury[selectedToken].token.supply) *
												1000
										) / 100}
									</b>
								</p>
							</div>
							<div className={styles.listItem}>
								<p>Balance</p>
								<p>
									<b>{formatErc(idea.treasury[selectedToken].balance)}</b>
								</p>
							</div>
						</div>
					)}
				</div>
				<div className={styles.bubblesPool}>
					<PieChart
						label={({ dataEntry }) => dataEntry.ticker}
						labelStyle={(i) => {
							return {
								filter: "invert(1.0)",
								fontWeight: "bold",
								transition: "0.3s",
								opacity: hovered === i ? "0.6" : "1.0",
							};
						}}
						onMouseOver={(_e, i) => setHovered(i)}
						onMouseOut={() => setHovered(-1)}
						data={idea.treasury.map(({ balance, token }, i) => {
							return {
								title: `${formatErc(balance)} ${token.ticker}`,
								value: balance / token.supply,
								color: ["#5D5FEF", "#7879F1", "#3E3F9F"][i % 3],
								ticker: token.ticker,
							};
						})}
						onClick={(e, i) => setSelectedToken(i)}
					/>
				</div>
			</div>
		</div>
	);
};
