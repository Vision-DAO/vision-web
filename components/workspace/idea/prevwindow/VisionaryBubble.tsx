import styles from "./VisionaryListDisplay.module.css";
import Blockies from "react-blockies";

/**
 * A circle that occupies a given height and with, displayed as an ethereum block
 * icon seeded from the given address.
 *
 * TODO: Find a way to reverse resolve addresses to ceramic names, and load
 * the corresponding profile pictures
 */
export const VisionaryBubble = ({ seed, onClick, size, active }: { seed: string, onClick: () => void, size: number, active: boolean }) => {
	return (
		<div className={ `${styles.visBubble} ${active ? styles.active : ""}`} onClick={ onClick } style={{ height: size, width: size }}>
			<Blockies
				seed={ seed }
				size={ size }
				scale={ 9 }
			/>
		</div>
	);
};
