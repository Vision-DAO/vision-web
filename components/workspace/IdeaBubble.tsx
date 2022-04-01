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
}

/**
 * A component that renders the details of a vision Idea on the mindmap.
 */
export const IdeaBubble = ({ title, ticker, totalSupply, addr }: IdeaBubbleProps) => {
	return (
		<div key={ addr } className={ styles.bubble }>
			<h1>{ title }</h1>
		</div>
	);
};
