import React from "react";
import { useContext } from "react";
import { IpfsContext } from "../../lib/util/ipfs";
import { useConnStatus } from "../../lib/util/networks";
import { useWeb3 } from "../../lib/util/web3";
import { WarningMessage } from "../status/WarningMessage";
import { useViewerConnection as useConnection } from "@self.id/framework";

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
	const [connection, ,] = useConnection();
	const web3 = useWeb3();
	const ipfs = useContext(IpfsContext);
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
	} else if (network != "polygon" && network != "polygon-test") {
		content = {
			title: "Wrong Network",
			message: "Please connect to the Polygon network to continue.",
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
			message: "Please login via Polygon to continue.",
		};
	}

	if (connection.status === "connecting") {
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

	return child;
};

export default NetworkedWorkspace;
