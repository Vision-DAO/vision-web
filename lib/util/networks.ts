import { useContext, useState, useEffect, Context, createContext } from "react";
import {
	useViewerConnection as useConnection,
	EthereumAuthProvider,
} from "@self.id/framework";
import { useWeb3 } from "./web3";
import { IDX } from "@ceramicstudio/idx";

export type Network = "ethereum" | "polygon" | "polygon-test" | "unknown";

/**
 * Registries deployed to different networks (used for bootstrapping).
 */
export const registries: Map<string, string | null> = new Map([
	["ethereum", null],
	["polygon", null],
	["polygon-test", "0x1612b47F78B98F1Beb1794Ffa9f3EB45877D3D7E"],
]);

export const zAddr = "0x0000000000000000000000000000000000000000";

/**
 * Address of the Vision token on different networks.
 */
export const visTokenAddr: { [net: string]: string } = {
	"polygon-test": "0x2F05236dB332C92853E5C53177474B3eEeF20137",
};

/**
 * Instantiated when the user is requested to connect with ceramic.
 */
export const AuthContext: Context<
	[EthereumAuthProvider | null, (e: EthereumAuthProvider) => void]
> = createContext([null, null]);

/**
 * Instantiated when the user connects to ethereum.
 */
export const VisContext: Context<string> = createContext(null);

export const ConnectionContext: Context<[ConnStatus, () => void]> =
	createContext([
		{
			present: false,
			connected: false,
			network: "unknown",
			initialized: false,
		},
		null,
	]);

/**
 * Instantiated when the user connects to ceramic.
 */
export const IdxContext: Context<[IDX, (idx: IDX) => void]> = createContext([
	null,
	null,
]);

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
	polygon: "https://polygonscan.com",
	ethereum: "https://etherscan.io",
};

/**
 * Generates a topic ID for the network currently connected.
 */
export const networkIdeasTopic = (connStatus: ConnStatus) =>
	`test_vision_ideas_${connStatus.network}`;

/**
 * Prompts the user to consent to sharing their list of accounts.
 */
export const connectMetamask = async (ethProvider: any): Promise<void> => {
	await ethProvider.request({
		method: "wallet_requestPermissions",
		params: [{ eth_accounts: {} }],
	});
	await ethProvider.request({ method: "eth_requestAccounts" });
};

export const formatBig = (n: number): string =>
	Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 2,
	}).format(n);

/**
 * Produces a locale string suitable to ERC-20 balances.
 */
export const formatErc = (n: number): string => formatBig(n / Math.pow(10, 18));

/**
 * Formats a date object in YYYY/mm/d format.
 */
export const formatDateObj = (d: Date): string =>
	`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

/**
 * Extracts the month, day, and year from a UNIX timestamp.
 */
export const formatDate = (n: number): string =>
	formatDateObj(new Date(n * 1000));

/**
 * Gets a list of the user's active accounts.
 */
export const accounts = (ethProvider: any): Promise<string[]> =>
	ethProvider.request({ method: "eth_requestAccounts" });

/**
 * Issues a request to add the polygon network and change the user's active
 * network to it.
 */
export const requestChangeNetwork = async (ethProvider: any): Promise<void> => {
	await ethProvider.request({
		method: "wallet_addEthereumChain",
		params: [
			{
				chainId: "0x13881",
				chainName: "Polygon Testnet",
				nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
				rpcUrls: [
					"https://nd-333-212-679.p2pify.com/b3780ceca4a0bb12fd62cbecd480efef",
				],
				blockExplorerUrls: ["https://mumbai.polygonscan.com"],
			},
		],
	});

	await ethProvider.request({
		method: "wallet_switchEthereumChain",
		params: [
			{
				chainId: "0x13881",
			},
		],
	});
};

/**
 * Consumes the global connection status.
 */
export const useConnStatus = (): [ConnStatus, () => void] =>
	useContext(ConnectionContext);

/**
 * Consumes the global Vision token address.
 */
export const useVisAddr = (): string => useContext(VisContext);

/**
 * Gets the currently active Ethereum account.
 */
export const useEthAddr = (): string => {
	const [, eth] = useWeb3();
	const [accs, setAccounts] = useState<string[]>([]);

	useEffect(() => {
		(async () => {
			setAccounts(await accounts(eth));
		})();
	}, [!eth]);

	return accs.length > 0 ? accs[0] : "";
};

/**
 * Gets the ethereum chain ID from the ethereum provider.
 */
export const chainId = (eth: any): Promise<number> =>
	eth.request({ method: "net_version" }).then((id: string) => Number(id));

/**
 * A hook returning whether a web3 client is present, and which network it's connected
 * to.
 *
 * @param ethProvider - a window.ethereum-like ethereum provider
 */
export const provideConnStatus = (
	ethProvider?: any
): [ConnStatus, () => void] => {
	const disconnected: ConnStatus = {
		present: false,
		connected: false,
		network: "unknown",
		initialized: false,
	};
	const [ethConnection, setEthConnection] = useState({
		...disconnected,
		initialized: false,
	});
	const [, connectCeramic, disconnectCeramic] = useConnection();

	useEffect(() => {
		// The client is not connected if no ethereum client is available
		if (!ethProvider) {
			if (ethConnection.present)
				setEthConnection((state) => {
					return { ...state, ...disconnected };
				});

			return;
		}

		if (!ethConnection.present) {
			setEthConnection((state) => {
				return { ...state, present: true };
			});
		}

		if (ethProvider.isConnected() && !ethConnection.connected) {
			setEthConnection((state) => {
				return { ...state, connected: true, present: true };
			});
		}

		// Perform a one-off check that the network state is consistent
		if (ethConnection.network == "unknown") {
			ethProvider.request({ method: "net_version" }).then((chainId: string) => {
				const canonId = networks[chainId] || "unknown";

				if (canonId != "unknown" && ethConnection.network == "unknown") {
					setEthConnection((state) => {
						return { ...state, network: canonId };
					});
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
			setEthConnection({
				...ethConnection,
				present: true,
				connected: true,
				network: networks[chainId] || "unknown",
			});
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

	return [
		ethConnection,
		() => setEthConnection({ ...ethConnection, initialized: true }),
	];
};

export const useRegistry = (): string => {
	const [conn] = useConnStatus();

	return registries.get(conn.network);
};
