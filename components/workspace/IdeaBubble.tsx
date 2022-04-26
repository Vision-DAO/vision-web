import styles from "./IdeaBubble.module.css";

/**
 * Information to be displayed for an Idea's bubble:
 * the most basic information about an Idea possible.
 */
export interface BasicIdeaInformation {
	/* ERC-20 Details */
	title: string;

	/* Metadata details */
	image?: string;
	addr: string;
}

export interface IdeaBubbleProps {
	details: BasicIdeaInformation,

	size: number;
	active: boolean;
	onClick: () => void;
}

/**
 * A component that renders the details of a vision Idea on the mindmap.
 */
export const IdeaBubble = ({ details: { title, image, addr, }, size, active, onClick }: IdeaBubbleProps) => {
	return (
		<div key={ addr } className={ styles.bubble + (active ? ` ${styles.activeBubble}` : "")} style={{ transform: "scale(" + size + "," + size + ")" }} onClick={ onClick }>
			<h1>{ title }</h1>
			{ image && <img className={ styles.bubbleBg } src={ image } /> }
		</div>
	);
};
