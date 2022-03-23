import type { BasicProfile } from "@datamodels/identity-profile-basic";
import defaultProfileIcon from "../../assets/icons/baseline_account_circle_white_48dp.png";
import LoadingIcon from "../../status/Loading";
import { useState, useEffect } from "react";
import { blobify } from "../../util/blobify";

/**
 * A component that renders some non-null ceramic user profile.
 * Displays the user's profile picture, a loading icon, or a default profile
 * picture.
 */
const UserProfile = ({ u, profilePicture }: { u: BasicProfile, profilePicture?: Promise<Uint8Array> }) => {
	// The user's profile picture might still be loading in, so wait for it to
	// be done
	const [pfp, setPfp] = useState(<LoadingIcon />);

	// Load the user's profile picture from IPFS when the component is added
	useEffect(() => {
		// Do nothing if the user has no profile picture. Use their default pfp
		if (!profilePicture) {
			setPfp(<img src={defaultProfileIcon} />);

			return;
		}

		// Allow the user to load the image in
		profilePicture.then((imgData: Uint8Array) => {
			// Convert the IPFS data to an image link blob
			const imgSrc = blobify(window, imgData, defaultProfileIcon);

			setPfp(<img src={imgSrc} />);
		});
	});

	return (
		<div>
			<h1>{u.name}</h1>
			{ pfp }
		</div>
	);
};

export default UserProfile;
