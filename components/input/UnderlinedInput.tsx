import { useState, ChangeEvent } from "react";
import styles from "./UnderlinedInput.module.css";

/**
 * A component allowing the parent to listen to changes in a text field with
 * optional placeholder text, and a grey/white underline, indicating focus
 * status.
 */
export const UnderlinedInput = ({ placeholder = "", onChange }: { placeholder?: string, onChange?: (val: string) => void }) => {
	const [value, setValue] = useState("");
	const [editing, setEditing] = useState(false);

	// Handles updates to the input field by using the user's callback,
	// and updating the displayed text
	const onEdit = (e: ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);

		onChange(e.target.value);
	};

	return (
		<input
			className={ styles.underlinedInput }
			value={ value == "" && !editing ? placeholder : value }
			onChange={ onEdit }
			onFocus={ () => setEditing(true) }
			onBlur={ () => setEditing(false) }
		/>
	);
};
