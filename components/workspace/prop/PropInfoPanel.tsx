import { ExtendedProposalInformation } from "../../../lib/util/ipfs";

export const PropInfoPanel = ({ prop }: { prop: ExtendedProposalInformation }) => {
	let description = "This proposal does not have a description.";

	// The last utf-8 text entry is the proposal's description
	if (!Array.isArray(prop.data))
		prop.data = Object.values(prop.data);

	for (const data of prop.data) {
		if (data.kind === "utf-8") {
			description = (new TextDecoder()).decode(data.data);
		}
	}

	return (
		<div>
			<h1>{ prop.title }</h1>
			<p>{ description }</p>
		</div>
	);
};
