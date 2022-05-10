import { IpfsClient, loadExtendedProposalInfo, ExtendedProposalInformation  } from "../../../lib/util/ipfs";
import { ConnStatus, staticProposals } from "../../../lib/util/networks";
import Web3 from "web3";
import { isIdeaContract } from "../../../lib/util/discovery";

/**
 * Pages visible in the window navigator for a proposal.
 */
export const pages = ["About"];

/**
 * Fed into the Navigator wrapper. Loads basic, and extended proposal information, in succession.
 */
export const loader = async (ipfs: IpfsClient, web3: Web3, eth: any, conn: ConnStatus, addr: string): Promise<ExtendedProposalInformation> => {
	// Ensure that the active proposal is an ACTUAL proposal
	const propBytecode = await web3.eth.getCode(staticProposals[conn.network]);

	if (!propBytecode || !await isIdeaContract(web3, addr, propBytecode))
		return undefined;

	return await loadExtendedProposalInfo(ipfs, web3, { addr: addr, dataIpfsAddr: null });
};
