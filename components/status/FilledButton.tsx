import styles from "./FilledButton.module.css";

/**
 * A button with no rounded corners, and wih the primary color as its
 * background.
 */
export const FilledButton = ({ label, onClick, className = "" }: { label: string, onClick?: () => void, className?: string }) => {
	return (
		<div className={ className + " " + styles.filledButton } onClick={ onClick }>
			<h1>{ label }</h1>
		</div>
	);
};
