import { IdeaData, decodeIdeaDataUTF8, FileData } from "../../../../lib/util/ipfs";
import { blobify } from "../../../../lib/util/blobify";
import { ModalContext } from "../../../../lib/util/modal";
import FileRounded from "@mui/icons-material/AttachFileRounded";
import LinkIcon from "@mui/icons-material/LinkRounded";
import styles from "./MetadataDisplayNode.module.css";
import { GeneralModal } from "../../../status/GeneralModal";
import { deserialize } from "bson";
import { ReactElement, useContext } from "react";

export const MetadataDisplayNode = ({ children }: { children: IdeaData }) => {
	// Different kinds of metadata are rendered in different ways
	// Below is a jump table for visually displaying such metadata. Some have
	// side effects (file-blob, link)
	let render: ReactElement;
	let callback: () => void;

	// Used for displaying fully expanded metadata (i.e., fullscreen image)
	const [, setModal] = useContext(ModalContext);

	// Ideas store binary data, which can contain structured data, including
	// files, which have paths and stored data
	let f: FileData;

	// TODO: Show a popup with a preview of the attached file
	switch (children.kind) {
	case "utf-8":
		render = <p>{ decodeIdeaDataUTF8(children.data) }</p>;

		callback = () => {
			setModal(
				<GeneralModal title="Idea Description">
					<p>{ decodeIdeaDataUTF8(children.data) }</p>
				</GeneralModal>
			);
		};

		break;
	case "image-blob":
		try {
			f = deserialize(children.data, { promoteBuffers: true }) as FileData;
		} catch (e) {
			console.warn(e);

			break;
		}

		render = (
			<div className={ styles.imageNode }>
				<img src={ blobify(window, f.contents, "") } alt="Image Metadata" />
				<p className={ styles.fileNameLabel }>{ f.path }</p>
			</div>
		);

		callback = () => {
			setModal(
				<GeneralModal title={ f.path }>
					<img src={ blobify(window, f.contents, "") } />
				</GeneralModal>
			);
		};

		break;
	// Downloads the attached file
	case "file-blob":
		try {
			f = deserialize(children.data, { promoteBuffers: true }) as FileData;
		} catch (e) {
			console.warn(e);

			break;
		}

		render = (
			<div className={ styles.fileNode }>
				<FileRounded fontSize="large" />
				<a href={ blobify(window, f.contents, "") } className={ styles.fileNameLabel } download={ f.path }>{ f.path }</a>
			</div>
		);
		callback = undefined;

		break;
	// Open a new page when the user clicks on the link
	case "url-link":
		render = <LinkIcon fontSize="large" />;
		callback = () => window.open(decodeIdeaDataUTF8(children.data), "_blank");

		break;
	}

	return (
		<div className={ styles.metaNodeContainer } onClick={ callback }>
			{ render }
		</div>
	);
};
