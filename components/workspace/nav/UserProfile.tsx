import type { BasicProfile } from "@datamodels/identity-profile-basic";
import { useViewerID } from "@self.id/framework";
import defaultProfileIcon from "../../../public/icons/round_account_circle_white_48dp.png";
import { Skeleton, CircularProgress } from "@mui/material";
import namehash from "@ensdomains/eth-ens-namehash";
import { useEffect, useState } from "react";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import { blobify } from "../../../lib/util/blobify";
import { useWeb3 } from "../../../lib/util/web3";
import { accounts } from "../../../lib/util/networks";
import { EqDimContainer } from "../../input/EqDimContainer";
import Image from "next/image";
import { AddrOrEns } from "../../status/AddrOrEns";
import styles from "./UserProfile.module.css";

/**
 * A component that renders some non-null ceramic user profile.
 * Displays the user's profile picture, a loading icon, or a default profile
 * picture.
 */
const UserProfile = ({
	u,
	profilePicture,
}: {
	u: BasicProfile;
	profilePicture?: null | string | "loading";
}) => {
	const [web3, eth] = useWeb3();
	const id = useViewerID();

	// The user's ENS name or their ethereum address
	const [addr, setAddr] = useState<string | null>(null);

	useEffect(() => {
		if (addr !== null) return;

		(async () => {
			const rawAddr = (await accounts(eth))[0];
			setAddr(rawAddr);

			// Convert the user's eth address to an ENS address
			try {
				const q = rawAddr.toLowerCase().substring(2) + ".addr.reverse";
				const resolver = await web3.eth.ens.getResolver(q);
				const nh = namehash.hash(q);

				setAddr(await resolver.methods.name(nh).call());
			} catch (e) {
				console.warn(e);
			}
		})();
	}, []);

	// If the user has no profile picture, show the default one
	let pfp = <Image className={styles.pic} src={defaultProfileIcon} />;

	// Otherwise, allow it to load in
	if (profilePicture != undefined) {
		pfp = <CircularProgress sx={{ color: "white" }} />;

		// If the profile picture is done loading, show it by converting the blob
		// to an image
		if (profilePicture != "loading") {
			pfp = (
				<EqDimContainer width="60%">
					<img className={styles.pic} src={profilePicture} />
				</EqDimContainer>
			);
		}
	}

	const logout = () => {
		document.cookie.split(";").forEach((c) => {
			document.cookie =
				c.trim().split("=")[0] +
				"=;" +
				"expires=Thu, 01 Jan 1970 00:00:00 UTC;";
		});

		window.location.href = `${window.location.protocol}//${window.location.host}`;
	};

	return (
		<div className={`${styles.profileContainer} ${u.name || styles.default}`}>
			{pfp}
			<div className={styles.username}>
				<div className={styles.nameRow}>
					<LogoutIcon onClick={logout} className={styles.logoutBtn} />{" "}
					<h1>{u.name || "My Profile"}</h1>
				</div>
				{id === null ? <Skeleton variant="text" /> : <AddrOrEns addr={addr} />}
			</div>
		</div>
	);
};

export default UserProfile;
