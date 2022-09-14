import styles from "./VisionaryListDisplay.module.css";
import Blockies from "react-blockies";
import { useUserPic } from "../../../../lib/util/ipfs";

/**
 * A circle that occupies a given height and with, displayed as an ethereum block
 * icon seeded from the given address.
 *
 * TODO: Find a way to reverse resolve addresses to ceramic names, and load
 * the corresponding profile pictures
 */
export const VisionaryBubble = ({
	seed,
	onClick,
	size,
	active,
	identicon = true,
}: {
	seed: string;
	onClick: () => void;
	size: number;
	active: boolean;
	identicon?: boolean;
}) => {
	const img = useUserPic(seed);

	return (
		<div
			className={`${styles.visBubble} ${active ? styles.active : ""}`}
			onClick={onClick}
			style={{ height: size, width: size }}
		>
			{img !== undefined ? (
				<img
					height="100%"
					width="100%"
					className={styles.pfpBubble}
					src={img}
				/>
			) : (
				identicon && <Blockies seed={seed} size={size} scale={9} />
			)}
		</div>
	);
};
