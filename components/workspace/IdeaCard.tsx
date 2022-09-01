import { UserFeedDaoRepr } from "../../lib/util/graph";
import {
	IpfsStoreContext,
	IpfsContext,
	loadIdeaDescription,
} from "../../lib/util/ipfs";
import { formatErc } from "../../lib/util/networks";
import styles from "./IdeaCard.module.css";
import { Skeleton } from "@mui/material";
import { useContext, useEffect } from "react";
import MapIcon from "@mui/icons-material/Map";

/**
 * A compact card showing limited information about a DAO, including a user's
 * involvement in the DAO.
 */
export const IdeaCard = ({
	idea,
	balance,
	onShowMap,
}: {
	idea: UserFeedDaoRepr;
	balance: number;
	onShowMap: (id: string) => void;
}) => {
	const ipfs = useContext(IpfsContext);
	const [ipfsStore, setIpfsStore] = useContext(IpfsStoreContext);

	useEffect(() => {
		if (idea.ipfsAddr in ipfsStore && "description" in ipfsStore[idea.ipfsAddr])
			return;

		// Trigger a load of the description of the DAO
		(async () => {
			const res = await loadIdeaDescription(ipfs, idea.ipfsAddr);

			if (res === undefined) return;

			setIpfsStore(idea.ipfsAddr, "description", res);
		})();
	}, [idea.ipfsAddr]);

	const description =
		idea.ipfsAddr in ipfsStore && "description" in ipfsStore[idea.ipfsAddr]
			? ipfsStore[idea.ipfsAddr]["description"]
			: "";

	return (
		<div className={styles.card}>
			<div className={`${styles.infoLine} ${styles.spread}`}>
				<h2>{idea.name}</h2>
				<MapIcon
					className={styles.svgButton}
					fontSize="small"
					onClick={onShowMap}
				/>
			</div>
			{description === "" ? (
				<div className={styles.loadingContainer}>
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton width="80%" />
				</div>
			) : (
				<p>{description}</p>
			)}
			<div className={`${styles.infoLine} ${styles.spread}`}>
				<div className={styles.compoundLabel}>
					<p>
						{formatErc(balance)} <b>{idea.ticker}</b>
					</p>
					<p className={styles.secondary}>Balance</p>
				</div>
				<div className={styles.compoundLabel}>
					<p>{idea.users.length.toLocaleString()}</p>
					<p className={styles.secondary}>Members</p>
				</div>
			</div>
		</div>
	);
};
