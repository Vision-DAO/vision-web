import { ExtendedProposalInformation, loadBasicIdeaInfo, IpfsClient } from "../../../lib/util/ipfs";
import { BasicIdeaInformation } from "../IdeaBubble";
import { ConnStatus, explorers } from "../../../lib/util/networks";
import ArrowRight from "@mui/icons-material/ArrowRightAlt";
import { useRef, useEffect, useState } from "react";
import styles from "./PropFlowIndicator.module.css";
import CurrencyExchange from "@mui/icons-material/CurrencyExchange";
import EyeRounded from "@mui/icons-material/VisibilityRounded";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import Lightbulb from "@mui/icons-material/Lightbulb";
import { useRouter } from "next/router";

interface FundingTokenInfo {
	name: string;
	ticker: string;
	url: string;
}

export const PropFlowIndicator = ({ prop, dest, web3, ipfs, conn }: { prop: ExtendedProposalInformation, dest: string, web3: Web3, ipfs: IpfsClient, conn: ConnStatus }) => {
	const arrow = useRef(null);
	const arrowContainer = useRef(null);
	const router = useRouter();

	// Proposals are funded with a specific token. Find information about them
	// if available
	const [tokenInfo, setTokenInfo] = useState<FundingTokenInfo>(undefined);
	const [parentInfo, setParentInfo] = useState<BasicIdeaInformation>(undefined);

	const arrowDimensions = {
		width: 28.4334,
		arrowWidth: 12.01,
	};

	const path = (w: number): string => {
		return `M 16.01 11 H ${4 - w} v 2 h ${arrowDimensions.arrowWidth + w} v 3 L 20 12 l -3.99 -4 z`;
	};

	useEffect(() => {
		// Scale up the arrow SVG to fill its parent.
		if (arrow != null && arrowContainer != null && arrow.current.childNodes[0].clientWidth < 0.5 * arrowContainer.current.clientWidth) {
			const w = arrowContainer.current.clientWidth / arrowDimensions.width * arrowDimensions.arrowWidth;

			arrow.current.childNodes[0].setAttribute("d", path(w));
			arrow.current.setAttribute("viewBox", `${(4 - w) * 0.5} 0 24 24`);
		}

		if (parentInfo === undefined) {
			setParentInfo(null);

			(async () => {
				setParentInfo(await loadBasicIdeaInfo(ipfs, web3, prop.parentAddr));
			})();
		}

		if (tokenInfo === undefined) {
			setTokenInfo(null);

			(async () => {
				// The funding token is 0x000
				if ((new Set([...prop.rate.token])).keys.length === 2) {
					setTokenInfo(() => { return { name: "Ethereum", ticker: "ETH", url: "" }; });

					return;
				}

				// We only need to find:
				// - the name of the token being used for funding
				// - the ticker of the token being used for funding
				const erc20Abi: AbiItem[] = [
					{
						"constant": true,
						"inputs": [],
						"name": "name",
						"outputs": [
							{ "name": "", "type": "string" }
						],
						"payable": false,
						"stateMutability": "view",
						"type": "function"
					},
					{
						"constant": true,
						"inputs": [],
						"name": "symbol",
						"outputs": [
							{ "name": "", "type": "string" }
						],
						"payable": false,
						"stateMutability": "view",
						"type": "function"
					}
				];

				let name = "";
				let ticker = "";

				try {
					const contract = new web3.eth.Contract(erc20Abi, prop.rate.token);

					name = await contract.methods.name().call();
					ticker = await contract.methods.symbol().call();
				} catch (e) {
					console.warn(e);
				}

				const meta = {
					name: name,
					ticker: ticker,
					url: `${explorers[conn.network]}/address/${ prop.rate.token }`,
				};

				setTokenInfo(meta);
			})();
		}
	});

	return (
		<div className={ styles.flowIndicatorContainer }>
			<div className={ styles.flowAddr }>
				<EyeRounded />
				<a href={ `/ideas/${prop.parentAddr}/about` } onClick={ (e) => { e.preventDefault(); router.push(`/ideas/${prop.parentAddr}/about`); }}>{ parentInfo ? parentInfo.title : "Parent" }</a>
			</div>
			<div className={ styles.flowValue }>
				<div className={ styles.flowValueText }>
					<CurrencyExchange />
					<a href={ tokenInfo ? tokenInfo.url : "" }>{ prop.rate.value }<b>{ tokenInfo ? ` ${tokenInfo.ticker}` : "" }</b></a>
				</div>
				<div ref={ arrowContainer } className={ styles.arrow }>
					<ArrowRight ref={ arrow } sx={{ color: "#5D5FEF", opacity: 0.8 }} fontSize="large" />
				</div>
			</div>
			<div className={ styles.flowAddr }>
				<Lightbulb />
				<a href={ `/ideas/${prop.destAddr}/about` } onClick={ (e) => { e.preventDefault(); router.push(`/ideas/${prop.destAddr}/about`); }}>{ dest }</a>
			</div>
		</div>
	);
};
