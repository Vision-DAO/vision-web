import type { BasicProfile } from "@datamodels/identity-profile-basic";
import defaultProfileIcon from "../../../public/icons/round_account_circle_white_48dp.png";
import { CircularProgress } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { blobify } from "../../../lib/util/blobify";
import Image from "next/image";
import styles from "./UserProfile.module.css";

/**
 * A component that renders some non-null ceramic user profile.
 * Displays the user's profile picture, a loading icon, or a default profile
 * picture.
 */
const UserProfile = ({ u, profilePicture }: { u: BasicProfile, profilePicture?: null | Uint8Array | "loading" }) => {
	// If the user has no profile picture, show the default one
	let pfp = <Image className={styles.pic} src={defaultProfileIcon} />;

	// Otherwise, allow it to load in
	if (profilePicture != undefined) {
		pfp = <CircularProgress sx={{ color: "white" }} />;

		// If the profile picture is done loading, show it by converting the blob
		// to an image
		if (profilePicture != "loading") {
			// Convert the IPFS data to an image link blob
			const imgSrc = blobify(window, profilePicture, defaultProfileIcon);

			pfp = <img className={styles.pic} src={imgSrc} />;
		}
	}

	return (
		<div className={ styles.profileContainer }>
			{ pfp }
			<div className={ `${styles.username} ${u.name || styles.default}` }>
				<EditIcon className={ styles.actionIcon } />
				<h1>{ u.name || "User Name"}</h1>
			</div>
		</div>
	);
};

export default UserProfile;
