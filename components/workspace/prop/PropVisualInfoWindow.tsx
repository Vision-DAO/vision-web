import { ExtendedProposalInformation, ProposalVote, loadProposalVote, loadAllProposalVoters } from "../../../lib/util/ipfs";
import { VisualDisplaySelector } from "../../status/VisualDisplaySelector";
import { ImageRounded, InfoRounded } from "@mui/icons-material";
import { IdeaMetadataDisplay } from "../idea/prevwindow/IdeaMetadataDisplay";
import { PropVoteVisualization } from "./PropVoteVisualization";
import { useState, useEffect } from "react";
import Web3 from "web3";

/**
 * Displays information about the vote distribution, and the metadata of the
 * proposal.
 */
export const PropVisualInfoWindow = ({ prop, web3 }: { prop: ExtendedProposalInformation, web3: Web3 }) => {
	const [votes, setVotes] = useState<ProposalVote[]>(undefined);

	const availableViews = {
		"Info": {
			content: <PropVoteVisualization votes={ votes } />,
			navIcon: <InfoRounded fontSize="large" />,
		},
		"Details": {
			content: <IdeaMetadataDisplay data={ prop.data ?? [] } />,
			navIcon: <ImageRounded fontSize="large" />
		},
	};

	useEffect(() => {
		if (votes === undefined) {
			setVotes([]);

			// Load the list of votes for the proposal so that the distribution
			// can be displayed
			(async () => {
				const voters = await loadAllProposalVoters(web3, prop.address);

				if (!voters)
					return;

				// Each voter has a registered vote
				const votes = await Promise.all(voters.map((voter: string) => loadProposalVote(web3, prop.address, voter)));

				if (!votes)
					return;

				console.log(votes);

				setVotes(votes);
			})();
		}
	});

	return (
		<VisualDisplaySelector displays={ availableViews } />
	);
};
