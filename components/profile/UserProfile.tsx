import { BasicProfile } from "@datamodels/identity-profile-basic";
import { useState, useEffect, useContext } from "react";
import {
	usePublicRecord,
	useViewerRecord,
	useViewerConnection as useConnection,
} from "@self.id/framework";
import { ExtendedProfile } from "../../components/profile/ExtendedProfile";
import CircularProgress from "@mui/material/CircularProgress";
import defaultProfileIcon from "../../public/icons/account_circle_white_48dp.svg";
import defaultBackground from "../../public/images/default_background.jpg";
import { blobify } from "../../lib/util/blobify";
import { IpfsContext, getAll } from "../../lib/util/ipfs";

/**
 * Renders a profile for the user with the specified 3ID ID and ethereum address.
 */
export const UserProfile = ({ id, addr }: { id: string; addr: string }) => {
	const ctx = useContext(IpfsContext);

	// The user's profile will only be editable if the user is the same as [id]
	const [[[pfp, bg], loading], setImages] = useState([[null, null], true]);
	const [connection, ,] = useConnection();
	const isUser =
		connection.status == "connected" &&
		id !== null &&
		id !== undefined &&
		connection.selfID.id == id;

	// Load the indicated user's profile
	const profile = usePublicRecord("basicProfile", id);

	// And the locally active user's profile for mutation purposes
	const selfProfile = useViewerRecord("basicProfile");

	// Generate an empty profile if the record doesn't exist
	if (!profile.content) profile.content = {};

	if (!profile.content.name) profile.content.name = "User Name";

	useEffect(() => {
		// Load the user's profile picture if it hasn't already been loaded
		if (profile.content.image && ctx) {
			// Load in the image
			getAll(
				ctx,
				profile.content.image.original.src.replaceAll("ipfs://", "")
			).then((imgBlob) => {
				// Turn the image data into an src, and update the UI
				setImages(([[, bg], ..._rest]) => [
					[blobify(window, imgBlob, defaultProfileIcon), bg],
					false,
				]);
			});
		}

		// Load the user's background picture if it hasn't already been loaded
		if (profile.content.background && ctx) {
			// Load in the image
			getAll(
				ctx,
				profile.content.background.original.src.replaceAll("ipfs://", "")
			).then((imgBlob) => {
				// Turn the image data into an src, and update the UI
				setImages(([[pfp, ..._rest], _loading]) => [
					[pfp, blobify(window, imgBlob, defaultBackground)],
					false,
				]);
			});
		}
	}, [profile.content]);

	// Show a loading indicator if ceramic hasn't loaded it yet
	if (profile == null || profile.isLoading || loading || !ctx)
		return <CircularProgress sx={{ color: "white" }} />;

	// The user may trigger a name update from the profile display if their profile is editable.
	// Assume that if it is editable, that they may use an accessor record to mutate their 3ID record
	const handleChangeProfile = (profile: BasicProfile) => {
		// Only proceed to mutate the user's profile if they have the necessary permissions
		if (!isUser || !selfProfile.isMutable) return;

		// Update the user's name
		selfProfile.merge(profile);
	};

	return (
		<ExtendedProfile
			name={profile.content.name}
			addr={addr}
			bio={profile.content.description}
			background={bg || defaultBackground.src}
			profilePicture={pfp || defaultProfileIcon.src}
			editable={connection.status == "connected" && connection.selfID.id == id}
			onEditProfile={handleChangeProfile}
		/>
	);
};
