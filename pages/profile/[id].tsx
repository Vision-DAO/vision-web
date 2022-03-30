import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { usePublicRecord, useConnection } from "@self.id/framework";
import { ExtendedProfile } from "../../components/profile/ExtendedProfile";
import CircularProgress from "@mui/material/CircularProgress";
import defaultProfileIcon from "../../public/icons/account_circle_white_48dp.svg";
import defaultBackground from "../../public/images/default_background.jpg";
import { blobify } from "../../lib/util/blobify";
import { getAll, IpfsContext } from "../../lib/util/ipfs";

/**
 * Displays the profile information of the given user, allowing
 * edits to the profile if it is the actively signed-in user.
 */
export const Profile = () => {
	// Obtain a handle on the global IPFS client
	const ctx = useContext(IpfsContext);

	const router = useRouter();
	const { id } = router.query;
	const profileId = Array.isArray(id) ? id[0] : id;

	// The user's profile will only be editable if the user is the same as [id]
	const [[[pfp, bg], loading], setImages] = useState([[null, null], true]);

	// Load the indicated user's profile
	const profile = usePublicRecord("basicProfile", profileId);
	const [connection, ,] = useConnection();

	// Generate an empty profile if the record doesn't exist
	if (!profile.content)
		profile.content = {};

	if (!profile.content.name)
		profile.content.name = "User Name";

	// Use a default profile picture if there is no image attached to the user
	if (!profile.content.image && loading) {
		setImages([[null, null], false]);
	}

	useEffect(() => {
		// Load the user's profile picture if it hasn't already been loaded
		if (profile.content.image && !pfp && ctx) {
			// Load in the image
			getAll(ctx, profile.content.image.original.src)
				.then((imgBlob) => {
					// Turn the image data into an src, and update the UI
					setImages([[blobify(window, imgBlob, defaultProfileIcon), bg], false]);
				});
		}

		// Load the user's background picture if it hasn't already been loaded
		if (profile.content.background && !bg && ctx) {
			// Load in the image
			getAll(ctx, profile.content.background.original.src)
				.then((imgBlob) => {
					// Turn the image data into an src, and update the UI
					setImages([[pfp, blobify(window, imgBlob, defaultBackground)], false]);
				});
		}
	});

	// Show a loading indicator if ceramic hasn't loaded it yet
	if (profile == null || profile.isLoading || loading || !ctx)
		return <CircularProgress sx={{ color: "white" }} />;

	return <ExtendedProfile name={ profile.content.name } background={ bg || defaultBackground } profilePicture={ pfp || defaultProfileIcon } editable={ connection.status == "connected" && connection.selfID.id == profileId }/>;
};

export default Profile;
