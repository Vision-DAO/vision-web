import Image from "next/image";
import styles from "./ExtendedProfile.module.css";
import { BasicProfile } from "@datamodels/identity-profile-basic";
import DoneIcon from "@mui/icons-material/CheckCircleRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import SaveIcon from "@mui/icons-material/SaveRounded";
import ShareIcon from "@mui/icons-material/ShareRounded";
import { useState, useRef, useEffect } from "react";

export interface ExtendedProfileProps {
	/**
	 * The user's username.
	 */
	name: string;

	/**
	 * The user's bio.
	 */
	bio: string;

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
	onEditProfile: (profile: BasicProfile) => void;

	/**
	 * Whether this profile can be edited.
	 */
	editable: boolean;
}

/**
 * Renders the user's expanded profile details, assuming that they exist.
 */
export const ExtendedProfile = ({
	name,
	bio,
	background,
	profilePicture,
	editable,
	onEditProfile,
}: ExtendedProfileProps) => {
	const [formName, setFormName] = useState(name);
	const [formBio, setFormBio] = useState(bio);
	const [editing, setEditing] = useState(false);

	// Display the user's name, and allow edits if necessary
	let profileName = (
		<div className={`${styles.profileName}`}>
			<h1>{name}</h1>
		</div>
	);

	let description = (
		<div className={styles.bio}>
			<p>{bio}</p>
		</div>
	);

	if (editable && editing) {
		profileName = (
			<div className={`${styles.profileName} ${styles.editing}`}>
				<input
					type="text"
					value={formName}
					placeholder={name}
					onChange={(e) => setFormName(e.target.value)}
				/>
			</div>
		);

		description = (
			<div className={styles.bio}>
				<textarea
					value={formBio}
					placeholder={bio?.length > 0 ? bio : "bio"}
					onChange={(e) => setFormBio(e.target.value)}
				/>
			</div>
		);
	}

	return (
		<div
			className={`${styles.profileContainer}${
				editable ? " " + styles.editable : ""
			}`}
		>
			<div className={styles.banner}>
				<Image
					layout="fill"
					objectFit="cover"
					objectPosition="center center"
					src={background}
				/>
			</div>
			<div className={styles.profileInfo}>
				<div className={styles.profilePicContainer}>
					<Image
						layout="fill"
						objectFit="contain"
						objectPosition="center center"
						src={profilePicture}
					/>
				</div>
				<div className={styles.textInfo}>
					<div className={styles.userInfo}>
						{profileName}
						<div className={styles.actionButtons}>
							{editing ? (
								<SaveIcon
									onClick={() => {
										setEditing(false);
										onEditProfile({ name: formName, description: formBio });
									}}
								/>
							) : (
								<EditIcon onClick={() => setEditing(true)} />
							)}
							<ShareIcon />
						</div>
					</div>
					{description}
				</div>
			</div>
		</div>
	);
};
