import { IdeaData, ItemDataKind, FileData } from "../../lib/util/ipfs";
import { OutlinedOptionSelector } from "./OutlinedOptionSelector";
import { UnderlinedInput } from "./UnderlinedInput";
import { useState } from "react";
import styles from "./MultiTypeInput.module.css";
import { FileUploadButton } from "./FileUploadButton";
import { serialize } from "bson";

export interface MultiTypeInputProps {
	label?: string;
	onChange?: (data: IdeaData[]) => void;
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
	const [data, setData] = useState<{ [kind: string]: PartialIdeaData }>({});
	const [activeInput, setActiveInput] = useState<string>("");

	// Unserialized, raw data presented to the user for feedback purposes
	const [inputValues, setInputValues] = useState({});

	const encStringData = async (val: string): Promise<Uint8Array> => {
		const enc = new TextEncoder();

		return enc.encode(val);
	};

	// Reads the contents of the file, and returns a byte array of its contents
	//
	// TODO: Support folder/directory uploads
	const encFile = async (val: File): Promise<Uint8Array> => {
		const data: FileData = {
			"path": val.name,
			"contents": new Uint8Array(await val.arrayBuffer()),
		};

		return new Uint8Array(serialize(data));
	};

	// Transforms the user's input update for text entries into a displayable text item
	const cacheStringData = async (val: string): Promise<string> => val;

	// Transforms the user's input update into a displayable text item
	const cacheFile = async (val: File): Promise<string> => val.name;

	// Generates a function that handles change events, updating the state
	// with the result of the given encoder
	const stateUpdater = <T,>(kind: ItemDataKind, cacher: (val: T) => Promise<string>, encoder: (val: T) => Promise<Uint8Array>): (val: T) => Promise<void> => async (val: T) => {
		const encoded = await encoder(val);

		const newData = { ...data, [kind]: { kind: kind, data: encoded } };

		setData(newData);
		setInputValues({ ...inputValues, [kind]: await cacher(val) });
		onChange(Object.values(newData).filter((d) => d != undefined && d.kind && d.data).map((d) => d as IdeaData));
	};

	// Create input elements for each possible data submitted
	const inputs: { [kind: string]: JSX.Element } = {
		"utf-8": <UnderlinedInput
			startingValue={ inputValues["utf-8"] || undefined }
			key="utf-8"
			multiline={ true }
			placeholder="Item description text"
			onChange={ stateUpdater<string>("utf-8", cacheStringData, encStringData) }
		/>,
		"image-blob": <FileUploadButton
			startingValue={ inputValues["image-blob"] || undefined }
			key="image-blob"
			onChange={ stateUpdater<File>("image-blob", cacheFile, encFile) }
		/>,
		"file-blob": <FileUploadButton
			startingValue={ inputValues["file-blob"] || undefined }
			key="file-blob"
			onChange={ stateUpdater<File>("file-blob", cacheFile, encFile) }
		/>,
		"url-link": <UnderlinedInput
			startingValue={ inputValues["url-link"] || undefined }
			key="url-link"
			placeholder="Item data link"
			onChange={ stateUpdater<string>("url-link", cacheStringData, encStringData) }
		/>,
	};

	const labelMeanings = {
		"Text": "utf-8",
		"Image": "image-blob",
		"File Upload": "file-blob",
		"URL Link": "url-link",
	};

	const clearInputs = (kind: string) => {
		setData(data => { return { ...data, [labelMeanings[kind]]: undefined }; });
		setInputValues(inputValues => { return { ...inputValues, [labelMeanings[kind]]: undefined }; });
		setActiveInput("");
	};

	return (
		<div>
			<h2 className={ styles.inputLabel }>{ label }</h2>
			<div className={ styles.inputItems }>
				<OutlinedOptionSelector
					options={ Object.keys(labelMeanings) }
					activeOptions={ new Set(Object.keys(labelMeanings).filter((inputType) => labelMeanings[inputType] in data && data[labelMeanings[inputType]] !== undefined)) }
					onClear={ clearInputs }
					onChange={ (kind) => setActiveInput(kind) }
				/>
				{ activeInput && inputs[labelMeanings[activeInput]] }
			</div>
		</div>
	);
};
