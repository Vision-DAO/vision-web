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
import { FilledButton } from "../status/FilledButton";
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

	useEffect(() => {
		if (line.current === null) return;

		let lineHeight = line.current.clientHeight;
		const style = getComputedStyle(line.current);
		lineHeight -=
			parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

		setLineHeight(lineHeight * 1.5);
	}, [window.innerHeight, window.innerWidth, line.current === null]);

	return (
		<div className={styles.beneficTooltip} onClick={actionLink}>
			<ArrowForwardIcon />
			<p ref={line}>{beneficiaryTitle}</p>
			<img
				className={styles.beneficIcon}
				height={lineHeight}
				width={lineHeight}
				src={beneficiaryIcon ?? beneficiaryDaoIcon}
			/>
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
		const url = `${window.location.protocol}//${window.location.host}/proposals/${prop.id}`;

		if (navigator.share) {
			navigator.share({
				title: prop.title,
				url: url,
			});

			return;
		}

		navigator.clipboard.writeText(url);
	};

	return (
		<div className={styles.propCard}>
			<h2 className={styles.propTitle}>{prop.title}</h2>
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
				{icon ? (
					<img className={styles.contentImg} src={icon} width="25%" />
				) : (
					<Skeleton variant="rectangular" width="25%" height="5em" />
				)}
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
						{prop.status === "Pending" ? (
							<PercentageLine percentage={prop.votesFor / prop.funder.supply} />
						) : (
							<div
								className={
									{ Rejected: styles.rejected, Accepted: styles.Accepted }[
										prop.status
									]
								}
							>
								{
									{
										Rejected: <ClearIcon />,
										Accepted: <CheckIcon />,
									}[prop.status]
								}
								<p>{prop.status}</p>
							</div>
						)}
					</div>
					<div className={`${styles.row} ${styles.full} ${styles.actionRow}`}>
						<FilledButton
							className={`${styles.actionButton} ${styles.primaryButton}`}
							label="VIEW PROPOSAL"
							onClick={() => router.push(`/proposals/${prop.id}`)}
						/>
						<FilledButton
							className={styles.actionButton}
							label="SHARE"
							onClick={shareProp}
						>
							{[<ShareIcon className={styles.shareIcon} fontSize="small" />]}
						</FilledButton>
					</div>
				</div>
			</div>
		</div>
	);
};
