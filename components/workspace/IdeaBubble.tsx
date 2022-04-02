import styles from "./IdeaBubble.module.css";
export interface IdeaBubbleProps {
	/* ERC-20 Details */
	title: string;
	ticker: string;
	totalSupply: number;

	/* Metadata details */
	image?: string;
	description: string;

	addr: string;

	size: number,
}

/**
 * A component that renders the details of a vision Idea on the mindmap.
 */
export const IdeaBubble = ({ title, ticker, totalSupply, addr, size }: IdeaBubbleProps) => {
	return (
		<div key={ addr } className={ styles.bubble } style={{ transform: "scale(" + size + "," + size + ")" }}>
			<h1>{ title }</h1>
		</div>
	);
};
