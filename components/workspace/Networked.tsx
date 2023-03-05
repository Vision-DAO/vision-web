import React from "react";
import { useContext, useEffect, useState } from "react";
import { IpfsContext } from "../../lib/util/ipfs";
import { ClientContext } from "../../lib/util/graph";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";
import { CeramicApi } from "@ceramicnetwork/common";
import {
	useConnStatus,
	accounts as getAccounts,
	AuthContext,
} from "../../lib/util/networks";
import { useWeb3 } from "../../lib/util/web3";
import { WarningMessage } from "../status/WarningMessage";
import {
	useClient,
	useViewerConnection as useConnection,
	useViewerRecord,
	EthereumAuthProvider,
} from "@self.id/framework";

/**
 * - Displays a "no Ethereum provider" message if there is no window.ethereum
 * - Displays a "wrong network" message if the window.ethereum isn't connected
 * to polygon
 */
export const NetworkedWorkspace = ({
	children,
}: {
	children: React.ReactElement;
}) => {
	const [{ connected, present, network }] = useConnStatus();
	const client = useClient();
	const [connection, ,] = useConnection();
	const [accountsSynced, setAccountsSynced] = useState(false);
	const web3 = useWeb3();
	const ipfs = useContext(IpfsContext);
	const graphClient = useContext(ClientContext);
	const [auth] = useContext(AuthContext);
	let content: { title: string; message: string; loading?: boolean } | null =
		null;
	let child: React.ReactElement = null;

	// Wait for the user to connect to IPFS
	if (!ipfs) {
		content = {
			title: "Connecting to IPFS",
			message: "Forming a connection to the IPFS network.",
			loading: true,
		};
	}

	if (!present || !web3) {
		content = {
			title: "No Ethereum Provider",
			message: "Please install a web3 provider to continue.",
		};
	} else if (network != "arbitrum-one") {
		content = {
			title: "Wrong Network",
			message: "Please connect to the Arbitrum network to continue.",
		};
	} else if (!connected) {
		content = {
			title: "Not Connected",
			message: "Unable to communicate with the Ethereum network.",
		};
	}

	if (connection.status != "connected") {
		content = {
			title: "Not Connected",
			message: "Please login via Arbitrum to continue.",
		};
	}

	if (connection.status === "connecting" || graphClient === undefined) {
		content = {
			title: "Connecting",
			message: "Forming a connection to the Ceramic network.",
			loading: true,
		};
	}

	if (!content) {
		child = children;
	} else {
		child = (
			<WarningMessage
				title={content.title}
				message={content.message}
				loading={content.loading}
			/>
		);
	}

	// Check that the user has their Ethereum address registered, and if not, register it
	useEffect(() => {
		if (accountsSynced) return;
		if (!client.ceramic.context.did) return;
		if (auth === null) return;

		(async () => {
			setAccountsSynced(true);

			// Register a reverse-DNS-like link for ETH addr -> ceramic
			const ceramic = client.ceramic;
			const accountId = await auth.accountId();
			const accountLink = await Caip10Link.fromAccount(
				ceramic as unknown as CeramicApi,
				accountId.toString()
			);

			await accountLink.setDid(ceramic.context.did, auth);
		})();
	}, [client.ceramic.context.did]);

	return child;
};

export default NetworkedWorkspace;
