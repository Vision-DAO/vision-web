import styles from "./OutlinedListEntry.module.css";
import { ReactElement } from "react";

export interface OutlinedListEntryProps {
	key?: string;
	roundTop?: boolean;
	roundBottom?: boolean;
	altColor?: boolean;
	onClick?: () => void;
	className?: string;
}

/**
 * A row in a list that can be clicked, and that renders some list of children
 * equally spaced in its area.
 */
export const OutlinedListEntry = ({ children, styles: { key, roundTop = true, roundBottom = true, altColor = false, onClick, className } = {} }: { styles?: OutlinedListEntryProps, children: ReactElement[] | ReactElement }) => {
	return (
		<div className={ `${styles.activityRow} ${onClick ? styles.clickable : ""} ${roundTop ? styles.roundedTop : ""} ${roundBottom ? styles.roundedBottom : ""} ${altColor ? styles.darkerBg : ""} ${className}` } key={ key } >
			{ children }
		</div>
	);
};
