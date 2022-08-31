import { useState, useEffect, HTMLProps } from "react";
import { useWeb3 } from "../../lib/util/web3";
import { Skeleton } from "@mui/material";
import namehash from "@ensdomains/eth-ens-namehash";

/**
 * Renders an ENS name, or an ethereum address for the specified ceramic user.
 */
export const AddrOrEns = ({
	addr,
	...props
}: { addr: string } & HTMLProps<HTMLParagraphElement>) => {
	const [ens, setEns] = useState<string | null | undefined | "none">(undefined);
	const [web3] = useWeb3();

	useEffect(() => {
		if (ens !== undefined) return;

		(async () => {
			try {
				setEns(null);

				const lookup = addr.substring(2, addr.length) + ".addr.reverse";

				const resolver = await web3.eth.ens.getResolver(lookup);

				const nh = namehash.hash(lookup);
				setEns(await resolver.methods.name(nh).call());
			} catch (e) {
				console.warn(e);

				setEns("none");
			}
		})();
	});

	if (ens === null || ens === undefined) return <Skeleton variant="text" />;

	return <p {...props}>{ens !== "none" ? ens : addr}</p>;
};
