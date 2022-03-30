import React from "react";
import { useConnStatus } from "../../lib/util/networks";
import { WarningMessage } from "../status/WarningMessage";
import { useConnection } from "@self.id/framework";

/**
 * - Displays a "no Ethereum provider" message if there is no window.ethereum
 * - Displays a "wrong network" message if the window.ethereum isn't connected
 * to polygon
 */
export const NetworkedWorkspace = ({ children, ctx }: { children: React.ReactElement, ctx: any }) => {
	const [{ connected, present, network }, ] = useConnStatus(ctx);
	const [connection, ,] = useConnection();
	let content: { title: string, message: string } |  null = null;
	let child: React.ReactElement = null;

	if (!present) {
		content = {
			title: "No Ethereum Provider",
			message: "Please install a web3 provider to continue.",
		};
	} else if (network != "polygon") {
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

	if (connection.status == "disconnected") {
		content = {
			title: "Not Connected",
			message: "Please login via Polygon to continue.",
		};
	}

	if (!content) {
		child = children;
	} else {
		child = <WarningMessage
			title={ content.title }
			message={ content.message }
		/>;
	}

	return child;
};

export default NetworkedWorkspace;
