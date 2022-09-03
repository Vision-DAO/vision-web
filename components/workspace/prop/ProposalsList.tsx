import {
	GossipProposalInformation,
	ExtendedProposalInformation,
	IpfsClient,
	loadExtendedProposalInfo,
} from "../../../lib/util/ipfs";
import { isIdeaContract } from "../../../lib/util/discovery";
import {
	staticProposals,
	useConnStatus,
	accounts,
} from "../../../lib/util/networks";
import { useState, useEffect } from "react";
import { ProposalLine } from "./ProposalLine";
import { OutlinedListEntry } from "../../status/OutlinedListEntry";
import styles from "./ProposalsList.module.css";
import LinearProgress from "@mui/material/LinearProgress";
import Idea from "../../../value-tree/build/contracts/Idea.json";
import Web3 from "web3";
import { GetPropsQuery } from "../../../.graphclient";

/**
 * Renders a list of gossiped proposals.
 */
export const ProposalsList = ({
	web3,
	eth,
	ipfs,
	proposals,
	onSelectProp,
}: {
	web3: Web3;
	eth: any;
	ipfs: IpfsClient;
	proposals: GetPropsQuery;
	onSelectProp?: (addr: string, prop: ExtendedProposalInformation) => void;
}) => {
	// Finalizes a proposal
	const handleFinalize = async (prop: ExtendedProposalInformation) => {
		const contract = new web3.eth.Contract(Idea.abi, prop.parentAddr);
		const acc = (await accounts(eth))[0];
		await contract.methods
			.finalizeProp(prop.addr)
			.send({ from: acc })
			.on("error", (e) => {
				alert(e);
			})
			.on("transactionHash", (hash: string) => {
				setStatusMessage([true, `Finalizing proposal: ${hash}`]);
			})
			.on("receipt", () => {
				setStatusMessage([false, ""]);
			});
	};

	return (
		<div className={styles.list}>
			<OutlinedListEntry
				styles={{
					className: styles.spacedList,
					roundTop: true,
					roundBottom: false,
					altColor: true,
				}}
			>
				<p>
					<b>To Fund</b>
				</p>
				<p>
					<b>Description</b>
				</p>
				<p>
					<b>Total Votes</b>
				</p>
				<p>
					<b>Status</b>
				</p>
				<p></p>
			</OutlinedListEntry>
			{statusMessage && statusMessage[1] !== "" ? (
				<OutlinedListEntry
					styles={{
						className: styles.spacedList,
						roundTop: false,
						roundBottom: true,
					}}
				>
					<p>{statusMessage[1]}</p>
					{statusMessage[0] && <LinearProgress />}
				</OutlinedListEntry>
			) : items.length > 0 ? (
				items.map(([addr, prop], i) => (
					<ProposalLine
						web3={web3}
						key={addr}
						addr={addr}
						prop={prop}
						props={{ roundTop: false, roundBottom: i === items.length - 1 }}
						onExpand={() => onSelectProp(addr, prop)}
						onFinalize={() => handleFinalize(prop)}
					/>
				))
			) : (
				<OutlinedListEntry
					styles={{ className: styles.spacedList, roundTop: false }}
				>
					<p>No proposals found.</p>
				</OutlinedListEntry>
			)}
		</div>
	);
};
