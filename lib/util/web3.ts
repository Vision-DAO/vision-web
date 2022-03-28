import Web3 from "web3";
import { useEffect, useState } from "react";

declare global {
	interface Window {
		ethereum: ConstructorParameters<typeof Web3>[0] | undefined;
	}
}

/**
 * Creates a web3 instance from the window's information, if an ethereum provider is available.
 */
export const useWeb3 = (): [Web3, any] | undefined => {
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
