import Image from "next/image";
import styles from "./ExtendedProfile.module.css";
import EditIcon from "@mui/icons-material/EditRounded";
import DoneIcon from "@mui/icons-material/CheckCircleRounded";
import { useState, useRef, useEffect } from "react";

export interface ExtendedProfileProps {
	/**
	 * The user's username.
	 */
	name: string;

	/**
	 * The src of the user's profile picture.
	 */
	profilePicture: string;

	/**
	 * The src of the user's bg banner.
	 */
	background: string;

	/**
	 * The user made a change to their username.
	 */
	onEditName: (name: string) => void,

	/**
	 * Whether this profile can be edited.
	 */
	editable: boolean;
}

/**
 * Renders the user's expanded profile details, assuming that they exist.
 */
export const ExtendedProfile = ({ name, background, profilePicture, editable, onEditName }: ExtendedProfileProps) => {
	const [formName, setFormName] = useState("");

	const [formWidth, setFormWidth] = useState(0);
	const inputWidthOracle = useRef<HTMLElement>(null);

	const [formIconWidth, setFormIconWidth] = useState(null);
	const formIconWidthOracle = useRef<HTMLDivElement>(null);

	// The edit icon should be invisible if text is already in the input
	const activeFormIconWidth = formName == "" ? formIconWidth : 0;

	useEffect(() => {
		// Set the width of the input element to the width of the pseudo element
		if (inputWidthOracle && inputWidthOracle.current)
			setFormWidth(inputWidthOracle.current.offsetWidth);
		if (formIconWidthOracle && formIconWidthOracle.current && formIconWidth == null)
			setFormIconWidth(formIconWidthOracle.current.offsetWidth);
	});

	// Display the user's name, and allow edits if necessary
	let profileName = (
		<div className={ styles.profileName }>
			<h1>{ name }</h1>
		</div>
	);

	if (editable) {
		profileName = (
			<div className={ styles.profileName }>
				<div className={ styles.fieldIcon } ref={ formIconWidthOracle } style={ activeFormIconWidth != null ? { width: activeFormIconWidth } : {}}>
					<EditIcon />
				</div>
				<input type="text" style={{ width: formWidth }} value={ formName } placeholder={ name } onChange={ (e) => setFormName(e.target.value) } />
				<span className={ styles.hiddenName } ref={ inputWidthOracle }>{ formName.length == 0 ? name : formName }</span>
				<div className={ `${styles.fieldIcon} ${styles.actionIcon}`} style={{ width: formName != "" ? formIconWidth : 0 }} onClick={ () => onEditName(formName) }>
					<DoneIcon />
				</div>
			</div>
		);
	}

	return (
		<div className={ `${styles.profileContainer}${editable ? " " + styles.editable : ""}`}>
			<div className={ styles.banner }>
				<Image layout="fill" objectFit="cover" objectPosition="center center" src={ background } />
			</div>
			<div className={ styles.profileInfo }>
				<div className={ styles.profilePicContainer }>
					<Image layout="fill" objectFit="contain" objectPosition="center center" src={ profilePicture } />
				</div>
				{ profileName }
			</div>
		</div>
	);
};
