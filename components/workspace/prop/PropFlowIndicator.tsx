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
	const arrow = useRef(null);
	const arrowContainer = useRef(null);
	const router = useRouter();

	const funderLink = useActionLink(prop.funder.id, router);
	const fundeeLink = useActionLink(prop.toFund, router);

	const tokenLink = useActionLink(prop.rate.token, router);
	const fundingTicker = useSymbol(prop.rate.token);

	const arrowDimensions = {
		width: 28.4334,
		arrowWidth: 12.01,
	};

	const path = (w: number): string => {
		return `M 16.01 11 H ${4 - w} v 2 h ${
			arrowDimensions.arrowWidth + w
		} v 3 L 20 12 l -3.99 -4 z`;
	};

	useEffect(() => {
		// Scale up the arrow SVG to fill its parent.
		if (
			arrow != null &&
			arrowContainer != null &&
			arrow.current.childNodes[0].clientWidth <
				0.5 * arrowContainer.current.clientWidth
		) {
			const w =
				(arrowContainer.current.clientWidth / arrowDimensions.width) *
				arrowDimensions.arrowWidth;

			arrow.current.childNodes[0].setAttribute("d", path(w));
			arrow.current.setAttribute("viewBox", `${(4 - w) * 0.5} 0 24 24`);
		}
	}, [window.innerHeight, window.innerWidth]);

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
				<div ref={arrowContainer} className={styles.arrow}>
					<ArrowRight
						ref={arrow}
						sx={{ color: "#5D5FEF", opacity: 0.8 }}
						fontSize="large"
					/>
				</div>
			</div>
			<div className={styles.flowAddr}>
				<Lightbulb />
				<a onClick={fundeeLink}>{dest}</a>
			</div>
		</div>
	);
};
