import { useState, useRef } from "react";
import UploadRounded from "@mui/icons-material/UploadRounded";
import styles from "./FileUploadButton.module.css";

/**
 * A button that allows the user to upload a file, firing a callback.
 */
export const FileUploadButton = ({ startingValue, onChange }: { startingValue?: string, onChange: (f: File) => void }) => {
	const [currFile, setCurrFile] = useState<File>(null);
	const [currFileName, setCurrFileName] = useState<string>(startingValue);

	// We cannot trigger a file upload without a hidden input
	const fileUploadInput = useRef<HTMLInputElement>(null);

	const handleSelectFile = (f: FileList) => {
		if (f.length == 0)
			return;

		setCurrFile(f[0]);
		setCurrFileName(f[0].name);
		onChange(f[0]);
	};

	return (
		<div className={ styles.fileUploadContainer }>
			<input type="file" style={{ display: "none" }} ref={ fileUploadInput } onChange={ (e) => handleSelectFile(e.target.files) } />
			<div className={ styles.fileUploadButton } onClick={ () => fileUploadInput.current.click() }>
				<UploadRounded /><p>Select a File</p>
			</div>
			<div className={ styles.fileUploadStatus }>
				<p>{ currFileName ?? "No file selected." }</p>
			</div>
		</div>
	);
};
