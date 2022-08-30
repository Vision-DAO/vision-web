import Image from "next/image";
import { CID } from "multiformats/cid";
import styles from "./ExtendedProfile.module.css";
import { ChooseableImage } from "../input/ChooseableImage";
import { EqDimContainer } from "../input/EqDimContainer";
import { IpfsContext } from "../../lib/util/ipfs";
import { BasicProfile } from "@datamodels/identity-profile-basic";
import DoneIcon from "@mui/icons-material/CheckCircleRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import SaveIcon from "@mui/icons-material/SaveRounded";
import ShareIcon from "@mui/icons-material/ShareRounded";
import { AddrOrEns } from "../status/AddrOrEns";
import { useState, useContext, ChangeEvent } from "react";

export interface ExtendedProfileProps {
	/**
	 * The user's ethereum address.
	 */
	addr: string;

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
	addr,
	bio,
	background,
	profilePicture,
	editable,
	onEditProfile,
}: ExtendedProfileProps) => {
	const [formName, setFormName] = useState(name);
	const [formPfp, setFormPfp] = useState<() => Promise<object>>(null);
	const [formBg, setFormBg] = useState<() => Promise<object>>(null);
	const [formBio, setFormBio] = useState(bio);
	const [editing, setEditing] = useState(false);
	const ipfs = useContext(IpfsContext);

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
			<div className={`${styles.bio} ${styles.editing}`}>
				<textarea
					value={formBio}
					placeholder={bio?.length > 0 ? bio : "bio"}
					onChange={(e) => setFormBio(e.target.value)}
				/>
			</div>
		);
	}

	/**
	 * Uploads the file target of an input event to IPFS, and stores the new src
	 * in the respective state variable.
	 */
	const uploadAndSave = async (
		e: ChangeEvent<HTMLInputElement>,
		dispatch: (cid: string) => object
	): Promise<object> => {
		if (e.target.files.length === 0) return;

		const { cid } = await ipfs.add(e.target.files[0]);
		return dispatch(`ipfs://${cid.toString()}`);
	};

	return (
		<div
			className={`${styles.profileContainer}${
				editable ? " " + styles.editable : ""
			}`}
		>
			<div className={styles.banner}>
				<ChooseableImage
					width="100%"
					height="100%"
					src={background}
					style={{ objectFit: "cover" }}
					editing={editing}
					onChange={(e) =>
						setFormBg(() => () => {
							return uploadAndSave(e, (cid) => {
								return {
									background: {
										original: {
											src: cid,
											mimeType: e.target.files[0].type,
											width: 1070,
											height: 190,
										},
									},
								};
							});
						})
					}
				/>
			</div>
			<div className={styles.profileInfo}>
				<div className={styles.profilePicContainer}>
					<EqDimContainer width="100%">
						<ChooseableImage
							width="100%"
							height="100%"
							src={profilePicture}
							style={{ borderRadius: "50%", objectFit: "cover" }}
							onChange={(e) =>
								setFormPfp(() => () => {
									return uploadAndSave(e, (cid) => {
										return {
											image: {
												original: {
													src: cid,
													mimeType: e.target.files[0].type,
													width: 1000,
													height: 1000,
												},
											},
										};
									});
								})
							}
							editing={editing}
						/>
					</EqDimContainer>
				</div>
				<div className={styles.textInfo}>
					<div className={styles.userInfo}>
						{profileName}
						<div className={styles.actionButtons}>
							{editing ? (
								<SaveIcon
									onClick={async () => {
										setEditing(false);

										const pfp = formPfp !== null ? await formPfp() : {};
										const bg = formBg !== null ? await formBg() : {};

										onEditProfile({
											name: formName,
											description: formBio,
											...pfp,
											...bg,
										});
									}}
								/>
							) : (
								<EditIcon onClick={() => setEditing(true)} />
							)}
							<ShareIcon />
						</div>
					</div>
					<AddrOrEns className={styles.addrLabel} addr={addr} />
					{description}
				</div>
			</div>
		</div>
	);
};
