import { IdeaData, ItemDataKind } from "../../lib/util/ipfs";
import { OutlinedOptionSelector } from "./OutlinedOptionSelector";
import { UnderlinedInput } from "./UnderlinedInput";
import { useState } from "react";
import styles from "./MultiTypeInput.module.css";
import { FileUploadButton } from "./FileUploadButton";

export interface MultiTypeInputProps {
	label?: string;
	onChange?: (data: IdeaData) => void;
}

interface PartialIdeaData {
	kind?: ItemDataKind;
	data?: Uint8Array;
}

/**
 * A toggleable input that allows the user to input data of a variety of types.
 * Currently supported types are documented in lib/util/ipfs.ts
 */
export const MultiTypeInput = ({ label = "", onChange }: MultiTypeInputProps) => {
	const [data, setData] = useState<PartialIdeaData>({});

	const encStringData = async (val: string): Promise<Uint8Array> => {
		const enc = new TextEncoder();

		return enc.encode(val);
	};

	// Reads the contents of the file, and returns a byte array of its contents
	//
	// TODO: Support folder/directory uploads
	const encFile = async (val: File): Promise<Uint8Array> => new Uint8Array(await val.arrayBuffer());

	// Generates a function that handles change events, updating the state
	// with the result of the given encoder
	const stateUpdater = <T,>(encoder: (val: T) => Promise<Uint8Array>): (val: T) => Promise<void> => async (val: T) => {
		const encoded = await encoder(val);

		setData({ ...data, data: encoded });

		if (data.kind && data.data)
			onChange(data as IdeaData);
	};

	// TODO: Support multiple files and multiple files types, check mark to show uploaded
	const fileInput = <FileUploadButton onChange={ stateUpdater<File>(encFile) } />;

	// Create input elements for each possible data submitted
	const inputs: { [kind: string]: JSX.Element } = {
		"utf-8": <UnderlinedInput multiline={ true } placeholder="Item description text" onChange={ stateUpdater<string>(encStringData) } />,
		"image-blob": fileInput,
		"file-blob": fileInput,
		"url-link": <UnderlinedInput placeholder="Item data link" onChange={ stateUpdater<string>(encStringData) }/>,
	};

	const labelMeanings = {
		"Text": "utf-8",
		"Image": "image-blob",
		"File Upload": "file-blob",
		"URL Link": "url-link",
	};

	return (
		<div>
			<h2 className={ styles.inputLabel }>{ label }</h2>
			<div className={ styles.inputItems }>
				<OutlinedOptionSelector
					options={ Object.keys(labelMeanings) }
					onChange={ (kind) => setData({ kind: labelMeanings[kind] as ItemDataKind }) }
				/>
				{ data.kind && inputs[data.kind] }
			</div>
		</div>
	);
};
