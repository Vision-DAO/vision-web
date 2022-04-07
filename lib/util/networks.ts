import { useContext, useState, useEffect, Context, createContext } from "react";
import { useConnection } from "@self.id/framework";

export type Network = "ethereum" | "polygon" | "polygon-test" | "unknown";

export const ConnectionContext: Context<[ConnStatus, () => void]> = createContext(
	[
		{
			present: false,
			connected: false,
			network: "unknown",
			initialized: false
		},
		null
	]
);

/**
 * Whether the web3 client is connected, and what network it's connected to.
 */
export interface ConnStatus {
	connected: boolean;
	present: boolean;
	network: Network;
	initialized: boolean;
}

// Chain ID's for different networks used by vision
const networks = {
	// Polygon mumbai, mainnet
	80001: "polygon-test",
	137: "polygon",

	// Eth ropsten, mainnet
	1981: "ethereum",
	1: "ethereum",
};

export const explorers = {
	"polygon-test": "https://mumbai.polygonscan.com",
	"polygon": "https://polygonscan.com",
	"ethereum": "https://etherscan.io",
};

/**
 * Generates a topic ID for the network currently connected.
 */
export const networkIdeasTopic = (connStatus: ConnStatus) => `vision_ideas_${connStatus.network}`;

/**
 * Prompts the user to consent to sharing their list of accounts.
 */
export const connectMetamask = async (ethProvider: any): Promise<void> => {
	await ethProvider.request({method: "wallet_requestPermissions", params: [{ eth_accounts: {} }]});
	await ethProvider.request({method: "eth_requestAccounts"});
};

/**
 * Gets a list of the user's active accounts.
 */
export const accounts = (ethProvider: any): Promise<string[]> => ethProvider.request({method: "eth_requestAccounts"});

/**
 * Issues a request to add the polygon network and change the user's active
 * network to it.
 */
export const requestChangeNetwork = async (ethProvider: any): Promise<void> => {
	await ethProvider.request({
		method: "wallet_addEthereumChain",
		params: [{
			chainId: "0x89",
			chainName: "Polygon",
			nativeCurrency: { name: "Polygon", symbol: "MATIC" },
			rpcUrls: ["https://polygon-rpc.com"],
			blockExplorerUrls: ["https://polygonscan.com"] 
		}]
	});

	await ethProvider.request({
		method: "wallet_switchEthereumChain",
		params: [{
			chainId: "0x89",
		}],
	});
};

/**
 * Consumes the global connection status.
 */
export const useConnStatus = (): [ConnStatus, () => void] => useContext(ConnectionContext);

/**
 * A hook returning whether a web3 client is present, and which network it's connected
 * to.
 *
 * @param ethProvider - a window.ethereum-like ethereum provider
 */
export const provideConnStatus = (ethProvider?: any): [ConnStatus, () => void] => {
	const disconnected: ConnStatus = { present: false, connected: false, network: "unknown", initialized: false };
	const [ethConnection, setEthConnection] = useState({ ...disconnected, initialized: false });
	const [, connectCeramic, disconnectCeramic] = useConnection();

	useEffect(() => {
		// The client is not connected if no ethereum client is available
		if (!ethProvider) {
			if (ethConnection.present)
				setEthConnection(state => { return { ...state, ...disconnected }; });

			return;
		}

		if (!ethConnection.present) {
			setEthConnection(state => { return { ...state, present: true }; });
		}

		if (ethProvider.isConnected() && !ethConnection.connected) {
			setEthConnection(state => { return { ...state, connected: true, present: true }; });
		}

		// Perform a one-off check that the network state is consistent
		if (ethConnection.network == "unknown") {
			ethProvider.request({ method: "net_version" })
				.then((chainId: string) => {
					const canonId = networks[chainId] || "unknown";

					if (canonId != "unknown" && ethConnection.network == "unknown") {
						setEthConnection(state => { return { ...state, network: canonId }; });
					}
				});
		}

		// Re-render states relevant to the user's account
		const accountListener = () => {
			disconnectCeramic();
			connectCeramic();
		};

		ethProvider.on("accountsChanged", accountListener);

		// Metamask may disconnect during application usage
		const disconnectListener = (e: object) => {
			console.error(e);

			setEthConnection({ ...disconnected, present: true });
		};

		ethProvider.on("disconnect", disconnectListener);

		// Check the Ethereum network chain ID, and match it with a defined net
		// name
		const chainListener = ({ chainId }: { chainId: string }) => {
			setEthConnection({ ...ethConnection, present: true, connected: true, network: networks[chainId] || "unknown" });
		};

		ethProvider.on("connect", chainListener);
		ethProvider.on("chainChanged", chainListener);

		return () => {
			// Clean up provider listeners
			ethProvider.removeListener("disconnect", disconnectListener);
			ethProvider.removeListener("connect", chainListener);
			ethProvider.removeListener("chainChanged", chainListener);
			ethProvider.removeListener("accountsChanged", accountListener);
		};
	});

	return [ethConnection, () => setEthConnection({ ...ethConnection, initialized: true })];
};
