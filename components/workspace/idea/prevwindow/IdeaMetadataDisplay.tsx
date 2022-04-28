import { IdeaData } from "../../../../lib/util/ipfs";
import { MetadataDisplayNode } from "./MetadataDisplayNode";
import styles from "./IdeaMetadataDisplay.module.css";
import winStyles from "./IdeaPreviewWindow.module.css";

/**
 * Renders the data of an Idea as metadata in a view that is titled "Info"
 */
export const IdeaMetadataDisplay = ({ data }: { data: IdeaData[] }) => {
	return (
		<div className={ winStyles.prevWindow }>
			<h2 className={ winStyles.prevWindowHeader }>Info</h2>
			<div className={ styles.metadataPool }>
				{ Object.values(data).map((d, i) =>
					<MetadataDisplayNode key={ i }>{ d }</MetadataDisplayNode>
				)}
			</div>
		</div>
	);
};
