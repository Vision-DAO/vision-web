import { IpfsClient, loadBasicIdeaInfo, loadExtendedIdeaInfo } from "../../../lib/util/ipfs";
import { ConnStatus } from "../../../lib/util/networks";
import { ExtendedIdeaInformation } from "../../../components/workspace/IdeaDetailCard";
import Web3 from "web3";

/**
 * The list of pages that are navigable inside an idea.
 */
export const pages = ["About", "Proposals", "Discussion", "Market"];

/**
 * Fed into the IdeaNavigator wrapper. Loads basic, and extended idea information, in succession.
 */
export const loader = async (ipfs: IpfsClient, web3: Web3, eth: any, conn: ConnStatus, addr: string): Promise<ExtendedIdeaInformation> => {
	const basicInfo = await loadBasicIdeaInfo(ipfs, web3, addr);

	if (!basicInfo)
		return null;

	return await loadExtendedIdeaInfo(ipfs, conn.network, web3, basicInfo);
};
