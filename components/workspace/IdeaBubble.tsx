import styles from "./IdeaBubble.module.css";

export interface IdeaBubbleProps {
	/* ERC-20 Details */
	title: string;
	ticker: string;
	totalSupply: number;

	/* Metadata details */
	image?: string;
	link?: string;
	description?: string;

	addr: string;

	size: number;

	active: boolean;

	onClick: () => void;
}

/**
 * A component that renders the details of a vision Idea on the mindmap.
 */
export const IdeaBubble = ({ title, image, ticker, totalSupply, addr, size, active, onClick }: IdeaBubbleProps) => {
	return (
		<div key={ addr } className={ styles.bubble + (active ? ` ${styles.activeBubble}` : "")} style={{ transform: "scale(" + size + "," + size + ")" }} onClick={ onClick }>
			<h1>{ title }</h1>
			{ image && <img className={ styles.bubbleBg } src={ image } /> }
		</div>
	);
};
