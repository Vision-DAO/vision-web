import styles from "./ProfileTooltip.module.css";
import { AddrOrEns } from "./AddrOrEns";
import { usePublicRecord, useClient } from "@self.id/framework";
import { useState, useEffect } from "react";
import { chainId } from "../../lib/util/networks";
import { useUserPic } from "../../lib/util/ipfs";
import { useWeb3 } from "../../lib/util/web3";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";
import { Skeleton } from "@mui/material";
import Link from "next/link";

/**
 * Renders a clickable link displaying the username of the user, their profile
 * picture (if they have one), and their username (if they have one).
 *
 * Defaults to Ethereum address, and a blank picture.
 */
export const ProfileTooltip = ({ addr }: { addr: string }) => {
	const image = useUserPic(addr);
	const [id, setId] = useState<string | undefined>(undefined);
	const profile = usePublicRecord("basicProfile", id);

	const [, eth] = useWeb3();
	const client = useClient();

	// Load the user's ceramic ID for getting their profile picture
	useEffect(() => {
		(async () => {
			const netV = await chainId(eth);
			const link = await Caip10Link.fromAccount(
				client.ceramic,
				`eip155:${netV}:${addr}`
			);

			setId(link.did);
		})();
	}, []);

	return (
		<div className={styles.row}>
			{image ? <img src={image} /> : <Skeleton variant="circular" />}
			<Link href={`/profile/${addr}`}>
				<a>
					{profile.content?.name !== undefined ? (
						<p>profile.content.name</p>
					) : (
						<AddrOrEns addr={addr} />
					)}
				</a>
			</Link>
		</div>
	);
};
