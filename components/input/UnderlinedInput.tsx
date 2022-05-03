import { useState, ChangeEvent } from "react";
import styles from "./UnderlinedInput.module.css";

/**
 * A component allowing the parent to listen to changes in a text field with
 * optional placeholder text, and a grey/white underline, indicating focus
 * status.
 */
export const UnderlinedInput = ({ placeholder = "", startingValue = "", multiline = false, onChange, className = "" }: { placeholder?: string, startingValue?: string, multiline?: boolean, onChange?: (val: string) => void, className?: string }) => {
	const [value, setValue] = useState(startingValue || "");
	const [editing, setEditing] = useState(false);

	// Handles updates to the input field by using the user's callback,
	// and updating the displayed text
	const onEdit = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setValue(e.target.value);

		onChange(e.target.value);
	};

	const props = {
		className: styles.underlinedInput + (className ? ` ${className}` : ""),
		value: value == "" && !editing ? placeholder : value,
		onChange: onEdit,
		onFocus: () => setEditing(true),
		onBlur: () => setEditing(false),
	};

	if (multiline)
		return (
			<textarea
				{ ...props }
			/>
		);

	return (
		<input
			{ ...props }
		/>
	);
};
