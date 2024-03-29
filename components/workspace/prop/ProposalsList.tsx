import styles from "./ProposalsList.module.css";
import { GetPropsQuery, GetDaoAboutQuery } from "../../../.graphclient";
import { ProposalLine } from "./ProposalLine";

/**
 * Renders a list of gossiped proposals.
 */
export const ProposalsList = ({
	proposals,
	oldProps,
	parent,
	onSelectProp,
}: {
	proposals:
		| GetPropsQuery["idea"]["children"]
		| GetPropsQuery["idea"]["activeProps"];
	oldProps: GetPropsQuery["idea"]["children"];
	parent: GetDaoAboutQuery["idea"];
	onSelectProp?: (addr: string, prop: string) => void;
}) => {
	// Newly submitted proposals, and the old ones they are overwriting (if they exist)
	const statefulProps = proposals.map((prop) => [
		prop,
		oldProps.find((oProp) => oProp.toFund === prop.toFund),
	]);

	return (
		<div className={styles.listContainer}>
			<div className={styles.overlayBG} />
			<div className={styles.list}>
				{statefulProps.map(([prop, oldProp]) => (
					<ProposalLine
						key={prop.id}
						prop={prop}
						parent={parent}
						oldProp={oldProp}
						onExpand={() => onSelectProp(parent.id, prop.id)}
					/>
				))}
			</div>
		</div>
	);
};
