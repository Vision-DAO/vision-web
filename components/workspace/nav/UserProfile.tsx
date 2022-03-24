import type { BasicProfile } from "@datamodels/identity-profile-basic";
import defaultProfileIcon from "../../assets/icons/round_account_circle_white_48dp.png";
import LoadingIcon from "../../status/Loading";
import { blobify } from "../../util/blobify";

/**
 * A component that renders some non-null ceramic user profile.
 * Displays the user's profile picture, a loading icon, or a default profile
 * picture.
 */
const UserProfile = ({ u, profilePicture }: { u: BasicProfile, profilePicture?: null | Uint8Array | "loading" }) => {
	// If the user has no profile picture, show the default one
	let pfp = <img src={defaultProfileIcon} />;

	// Otherwise, allow it to load in
	if (profilePicture != undefined) {
		pfp = <LoadingIcon />;

		// If the profile picture is done loading, show it by converting the blob
		// to an image
		if (profilePicture != "loading") {
			// Convert the IPFS data to an image link blob
			const imgSrc = blobify(window, profilePicture, defaultProfileIcon);

			pfp = <img src={imgSrc} />;
		}
	}

	return (
		<div>
			<h1>{u.name}</h1>
			{ pfp }
		</div>
	);
};

export default UserProfile;
