import { UserFeedDaoRepr } from "../../lib/util/graph";
import { useIdeaDescription } from "../../lib/util/ipfs";
import {
	formatErc,
	formatBig,
	zAddr,
	useRegistry,
} from "../../lib/util/networks";
import styles from "./IdeaCard.module.css";
import { Skeleton } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

/**
 * A compact card showing limited information about a DAO, including a user's
 * involvement in the DAO.
 */
export const IdeaCard = ({
	idea,
	balance,
	onShowMap,
	props,
	votes,
	onShowIdea,
}: {
	idea: UserFeedDaoRepr;
	balance: number;
	props: number;
	votes: number;
	onShowMap: (id: string) => void;
	onShowIdea: (id: string) => void;
}) => {
	const description = useIdeaDescription(idea.ipfsAddr);
	const reg = useRegistry();

	return (
		<div className={styles.card}>
			<div className={`${styles.infoLine} ${styles.spread}`}>
				<h2>{idea.name}</h2>
				<div className={styles.compoundLabel}>
					<MapIcon
						className={styles.svgButton}
						fontSize="small"
						onClick={() => onShowMap(idea.id)}
					/>
					<FullscreenIcon
						className={styles.svgButton}
						fontSize="small"
						onClick={() => onShowIdea(idea.id)}
					/>
				</div>
			</div>
			<div className={styles.infoLine}>
				<div className={styles.compoundLabel}>
					<p>
						{formatBig(
							idea.users.filter(
								({ id }) =>
									![
										`g${zAddr}:${idea.id}`,
										`g${idea.id}:${idea.id}`,
										`g${reg}:${idea.id}`,
									].includes(id)
							).length
						)}
					</p>
					<p className={styles.secondary}>Members</p>
				</div>
			</div>
			{description === undefined ? (
				<div className={styles.loadingContainer}>
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton width="80%" />
				</div>
			) : (
				<p>{description}</p>
			)}
			<div className={`${styles.infoLine} ${styles.infoArea}`}>
				<div className={styles.compoundLabel}>
					<p>{props}</p>
					<p className={styles.secondary}>
						{`Proposal${props !== 1 ? "s" : ""}`} Authored
					</p>
				</div>
				<div className={styles.compoundLabel}>
					<p>{votes}</p>
					<p className={styles.secondary}>
						{`Vote${votes !== 1 ? "s" : ""}`} Cast
					</p>
				</div>
				<div className={styles.compoundLabel}>
					<p>
						{formatErc(balance)} <b>{idea.ticker}</b>
					</p>
					<p className={styles.secondary}>Balance</p>
				</div>
			</div>
		</div>
	);
};
