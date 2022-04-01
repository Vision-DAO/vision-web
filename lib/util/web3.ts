import Web3 from "web3";
import { useContext, useEffect, useState, createContext } from "react";

declare global {
	interface Window {
		ethereum: ConstructorParameters<typeof Web3>[0] | undefined;
	}
}

/**
 * A global instance of [web3, ethereum] ensured by the networked window
 * manager to be existent.
 */
export const Web3Context = createContext(undefined);

/**
 * Attempt to consume the web3 instance from the global web3 context.
 */
export const useWeb3 = (): [Web3, any] | undefined => useContext(Web3Context);

/**
 * Creates a web3 instance from the window's information, if an ethereum provider is available.
 */
export const provideWeb3 = (): [Web3, any] | undefined => {
	const [ctx, setWeb3] = useState(undefined);

	useEffect(() => {
		if (!window.ethereum) {
			return;
		}

		if (!ctx)
			setWeb3([new Web3(window.ethereum), window.ethereum]);
	});

	return ctx;
};
