import styles from "./IdeaBubble.module.css";
import { useChildIdeas } from "../../lib/util/discovery";
import { ReactElement, useRef, useState, useEffect, MutableRefObject } from "react";
import Web3 from "web3";

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

	//web3: Web3;
	size: string;
	ref?: MutableRefObject<HTMLDivElement>,
	active: boolean;
	onClick: () => void;
}

/**
 * A component that renders the details of a vision Idea on the mindmap.
 */
export const IdeaBubble = ({ details: { title, image, addr, }, size, active, ref, onClick }: IdeaBubbleProps) => {
	// Load the children of the bubble
	//const children: ReactElement[] = useChildIdeas(web3, addr);
	//
	
	return (
		<div ref={ ref } key={ addr } className={ styles.bubble + (active ? ` ${styles.activeBubble}` : "")} style={{ width: size, height: size }} onClick={ onClick }>
			<h1>{ title }</h1>
			{ image && <img className={ styles.bubbleBg } src={ image } /> }
		</div>
	);
};
