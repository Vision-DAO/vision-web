import { UserFeedQuery } from "../../.graphclient";
import styles from "./PropCard.module.css";
import {
	useActorTitle,
	useUserPic,
	useIdeaImage,
	useIdeaIpfsAddr,
	useIdeaDescription,
	useActionLink,
} from "../../lib/util/ipfs";
import { OutlinedButton } from "../status/OutlinedButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardRounded";
import ShareIcon from "@mui/icons-material/ShareRounded";
import { formatDate } from "../../lib/util/networks";
import { Skeleton } from "@mui/material";
import ClearIcon from "@mui/icons-material/ClearRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";
import { PercentageLine } from "../workspace/prop/PercentageLine";
import { ProfileTooltip } from "../status/ProfileTooltip";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useWindowSize } from "@react-hook/window-size";

/**
 * Renders the name of the beneficiary of a proposal.
 */
export const BeneficTooltip = ({ beneficiary }: { beneficiary: string }) => {
	const router = useRouter();
	const beneficiaryTitle = useActorTitle(beneficiary);
	const beneficiaryIcon = useUserPic(beneficiary);

	const daoIpfsAddr = useIdeaIpfsAddr(beneficiary);
	const beneficiaryDaoIcon = useIdeaImage(daoIpfsAddr);

	const line = useRef<HTMLParagraphElement>();
	const [lineHeight, setLineHeight] = useState<number>(0);

	const actionLink = useActionLink(beneficiary, router);

	const [wWidth, wHeight] = useWindowSize();

	useEffect(() => {
		if (line.current === null) return;

		let lineHeight = line.current.clientHeight;
		const style = getComputedStyle(line.current);
		lineHeight -=
			parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

		setLineHeight(lineHeight * 1.5);
	}, [wHeight, wWidth, line.current === null]);

	return (
		<div className={styles.beneficTooltip} onClick={actionLink}>
			<ArrowForwardIcon />
			<p ref={line}>{beneficiaryTitle}</p>
			{(beneficiaryIcon || beneficiaryDaoIcon) && (
				<img
					className={styles.beneficIcon}
					height={lineHeight}
					width={lineHeight}
					src={beneficiaryIcon ?? beneficiaryDaoIcon}
				/>
			)}
		</div>
	);
};

/**
 * Displays information about a proposal in the context of a user.
 */
export const PropCard = ({
	prop,
}: {
	prop: UserFeedQuery["user"]["ideas"][0]["props"]["props"][0];
}) => {
	const funderTitle = useActorTitle(prop.funder.id);
	const description = useIdeaDescription(prop.ipfsAddr);
	const icon = useIdeaImage(prop.ipfsAddr);
	const router = useRouter();

	const shareProp = () => {
		const url = `${window.location.protocol}//${window.location.host}/proposals/${prop.id}/about`;

		if (navigator.share) {
			navigator.share({
				title: prop.title,
				url: url,
			});

			return;
		}

		navigator.clipboard.writeText(url);
	};

	const expired = new Date() > new Date(prop.expiration * 1000);

	return (
		<div className={styles.propCard}>
			<h2
				className={`${styles.propTitle} ${styles.link}`}
				onClick={() => router.push(`/proposals/${prop.id}/about`)}
			>
				{prop.title}
			</h2>
			<div className={`${styles.row} ${styles.spaced} ${styles.full}`}>
				<div className={`${styles.row} ${styles.authorRow}`}>
					<ProfileTooltip addr={prop.author.id} />
					<p className={styles.separator}>•</p>
					<p>{funderTitle}</p>
					<p className={styles.separator}>•</p>
					<p>{formatDate(prop.createdAt)}</p>
				</div>
				<BeneficTooltip beneficiary={prop.toFund} />
			</div>
			<div className={styles.contentArea}>
				{icon && <img className={styles.contentImg} src={icon} width="25%" />}
				<div className={styles.rightInfoArea}>
					<div className={styles.column}>
						{description ? (
							<p className={styles.description}> {description}</p>
						) : (
							<div className={`${styles.column} ${styles.description}`}>
								<Skeleton variant="text" />
								<Skeleton variant="text" />
								<Skeleton variant="text" />
								<Skeleton variant="text" width="80%" />
							</div>
						)}
						{!expired ? (
							<PercentageLine percentage={prop.votesFor / prop.funder.supply} />
						) : (
							<div
								className={`${
									{
										Pending: styles.rejected,
										Rejected: styles.rejected,
										Accepted: styles.accepted,
									}[prop.status]
								} ${styles.statusIndicator}`}
							>
								{
									{
										Rejected: <ClearIcon />,
										Pending: <ClearIcon />,
										Accepted: <CheckIcon />,
									}[prop.status]
								}
								<p>{prop.status === "Accepted" ? "Accepted" : "Rejected"}</p>
							</div>
						)}
					</div>
					<div className={`${styles.row} ${styles.full} ${styles.actionRow}`}>
						<OutlinedButton
							className={styles.actionButton}
							callback={shareProp}
						>
							<h1>Share</h1>
							<ShareIcon className={styles.shareIcon} fontSize="small" />
						</OutlinedButton>
					</div>
				</div>
			</div>
		</div>
	);
};
