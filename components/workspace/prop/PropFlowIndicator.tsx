import { IpfsClient, useActionLink, useSymbol } from "../../../lib/util/ipfs";
import { PropInfo } from "../../../lib/util/proposals/module";
import { ConnStatus, formatErc } from "../../../lib/util/networks";
import ArrowRight from "@mui/icons-material/ArrowRightAlt";
import { useRef, useEffect } from "react";
import styles from "./PropFlowIndicator.module.css";
import CurrencyExchange from "@mui/icons-material/CurrencyExchange";
import EyeRounded from "@mui/icons-material/VisibilityRounded";
import Web3 from "web3";
import Lightbulb from "@mui/icons-material/Lightbulb";
import { useRouter } from "next/router";

export const PropFlowIndicator = ({
	prop,
	dest,
}: {
	prop: PropInfo;
	dest: string;
	web3: Web3;
	ipfs: IpfsClient;
	conn: ConnStatus;
}) => {
	const router = useRouter();

	const funderLink = useActionLink(prop.funder.id, router);
	const fundeeLink = useActionLink(prop.toFund, router);

	const tokenLink = useActionLink(prop.rate.token, router);
	const fundingTicker = useSymbol(prop.rate.token);

	return (
		<div className={styles.flowIndicatorContainer}>
			<div className={styles.flowAddr}>
				<EyeRounded />
				<a onClick={funderLink}>{prop.funder.name}</a>
			</div>
			<div className={styles.flowValue}>
				<div className={styles.flowValueText}>
					<CurrencyExchange />
					<a onClick={tokenLink} className={styles.tokenLink}>
						{formatErc(Number(prop.rate.value))}
						<b>{fundingTicker}</b>
					</a>
				</div>
				<ArrowRight fontSize="large" sx={{ color: "#5D5FEF" }} />
			</div>
			<div className={styles.flowAddr}>
				<Lightbulb />
				<a onClick={fundeeLink}>{dest}</a>
			</div>
		</div>
	);
};
