import Web3 from "web3";
import { useState, useEffect } from "react";

/**
 * Whether the web3 client is connected, and what network it's connected to.
 */
export interface ConnStatus {
	connected: boolean;
	network: "ethereum" | "polygon" | "unknown";
}

// Chain ID's for different networks used by vision
const networks = {
	// Polygon mumbai, mainnet
	80001: "polygon",
	137: "polygon",

	// Eth ropsten, mainnet
	1981: "ethereum",
	1: "ethereum",
};

/**
 * A hook returning whether a web3 client is present, and which network it's connected
 * to.
 */
export const useConnStatus = (w?: Web3): ConnStatus => {
	const disconnected: ConnStatus = { connected: false, network: "unknown" };
	const [ethConnection, setEthConnection] = useState(disconnected);

	useEffect(() => {
		// The client is not connected if no ethereum client is available
		if (!w) {
			setEthConnection(disconnected);

			return;
		}

		// Check the Ethereum network chain ID, and match it with a defined net
		// name
		/*w.eth.net.getId((e, id) => {
			// An error occurred
			if (e) {
				console.error(e);

				return;
			}

			const net = networks[id] || "unknown";
			setEthConnection({ connected: true, network: net });
		});*/
	});

	return ethConnection;
};
