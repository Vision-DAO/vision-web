import styles from "./ProfileTooltip.module.css";
import { AddrOrEns } from "./AddrOrEns";
import { usePublicRecord, useClient } from "@self.id/framework";
import { useUserPic, useCeramicId } from "../../lib/util/ipfs";
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
	const id = useCeramicId(addr);
	const profile = usePublicRecord("basicProfile", id);

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
