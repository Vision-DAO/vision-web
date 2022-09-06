import styles from "./ProfileTooltip.module.css";
import { AddrOrEns } from "./AddrOrEns";
import { usePublicRecord } from "@self.id/framework";
import { useUserPic, useCeramicId } from "../../lib/util/ipfs";
import { Skeleton } from "@mui/material";
import { useEffect, useState, useRef } from "react";
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
	const [imageHeight, setImageHeight] = useState<number>(0);
	const line = useRef<HTMLAnchorElement>();

	useEffect(() => {
		if (!line || !line.current) return;

		let lineHeight = line.current.clientHeight;
		const style = getComputedStyle(line.current);
		lineHeight -=
			parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

		setImageHeight(lineHeight);
	}, [line.current === null, window.innerHeight, window.innerWidth]);

	return (
		<div className={styles.row}>
			{image ? (
				<img
					src={image}
					height={`${imageHeight}px`}
					width={`${imageHeight}px`}
					className={styles.pfp}
				/>
			) : (
				<Skeleton variant="circular" />
			)}
			<Link href={`/profile/${addr}`}>
				<a ref={line}>
					{profile.content?.name !== undefined ? (
						<p>{profile.content.name}</p>
					) : (
						<AddrOrEns addr={addr} />
					)}
				</a>
			</Link>
		</div>
	);
};
