import { useRouter } from "next/router";
import { UserProfile } from "../../components/profile/UserProfile";
import { FullscreenProgress } from "../../components/status/FullscreenProgress";
import { useCeramicId } from "../../lib/util/ipfs";

/**
 * Displays the profile information of the given user, allowing
 * edits to the profile if it is the actively signed-in user.
 */
export const Profile = () => {
	const router = useRouter();
	const { id } = router.query;
	const profileAddr = Array.isArray(id) ? id[0] : id;
	const profileId = useCeramicId(profileAddr);

	if (profileId === null || profileId === undefined)
		return <FullscreenProgress />;

	return <UserProfile id={profileId} addr={profileAddr} />;
};

export default Profile;
