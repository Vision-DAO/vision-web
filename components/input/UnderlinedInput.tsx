import {
	useState,
	useEffect,
	ChangeEvent,
	MouseEvent,
	Ref,
	InputHTMLAttributes,
	ReactElement,
} from "react";
import styles from "./UnderlinedInput.module.css";

/**
 * A component allowing the parent to listen to changes in a text field with
 * optional placeholder text, and a grey/white underline, indicating focus
 * status.
 */
export const UnderlinedInput = ({
	placeholder = "",
	startingValue = "",
	icon,
	multiline = false,
	onChange,
	onClick,
	className = "",
	innerRef,
	value: remoteValue,
	...props
}: {
	icon?: ReactElement;
	placeholder?: string;
	startingValue?: string;
	multiline?: boolean;
	value?: string;
	onChange?: (val: string) => void;
	onClick?: (e: MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	className?: string;
	innerRef?: Ref<any>;
} & Omit<Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">, "ref">) => {
	const [value, setValue] = useState(startingValue || "");
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		if (remoteValue === undefined) return;

		setValue(remoteValue);
	}, [remoteValue !== undefined, remoteValue?.length ?? 0]);

	// Handles updates to the input field by using the user's callback,
	// and updating the displayed text
	const onEdit = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (e.target.value === undefined) return;

		setValue(e.target.value);

		onChange(e.target.value);
	};

	const ourProps = {
		className: styles.underlinedInput + (className ? ` ${className}` : ""),
		value: value == "" && !editing ? placeholder : value,
		onChange: onEdit,
		onFocus: () => setEditing(true),
		onBlur: () => setEditing(false),
	};

	if (multiline) return <textarea {...ourProps} />;

	return (
		<div className={styles.inputContainer}>
			{icon}
			<input
				ref={innerRef}
				onClick={onClick}
				{...props}
				{...ourProps}
				style={
					ourProps.value === placeholder
						? { color: "rgba(255, 255, 255, 0.6)", opacity: "0.5" }
						: undefined
				}
			/>
		</div>
	);
};
