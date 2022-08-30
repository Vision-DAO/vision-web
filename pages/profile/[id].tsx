import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { UserProfile } from "../../components/profile/UserProfile";
import { FullscreenProgress } from "../../components/status/FullscreenProgress";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";
import { useClient } from "@self.id/framework";
import { chainId } from "../../lib/util/networks";
import { useWeb3 } from "../../lib/util/web3";

/**
 * Displays the profile information of the given user, allowing
 * edits to the profile if it is the actively signed-in user.
 */
export const Profile = () => {
	const router = useRouter();
	const { id } = router.query;
	const profileAddr = Array.isArray(id) ? id[0] : id;
	const [profileId, setProfileId] = useState<string | null | undefined>(
		undefined
	);
	const [, eth] = useWeb3();

	// Transform the address of the other user into their full profile, which is on ceramic
	const client = useClient();

	useEffect(() => {
		if (profileId === null) return;

		(async () => {
			const netV = await chainId(eth);
			const link = await Caip10Link.fromAccount(
				client.ceramic,
				`eip155:${netV}:${profileAddr}`
			);

			setProfileId(link.did);
		})();
	});

	if (profileId === null || profileId === undefined)
		return <FullscreenProgress />;

	return <UserProfile id={profileId} addr={profileAddr} />;
};

export default Profile;
