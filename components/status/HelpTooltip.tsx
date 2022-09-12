import styles from "./HelpTooltip.module.css";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useWindowSize } from "@react-hook/window-size";

/**
 * Displays a question mark, with some information next to it upon click.
 */
export const HelpTooltip = ({
	children,
	tooltipPos = "right",
	style = "primary",
}: {
	children: ReactElement;
	tooltipPos?: "left" | "right";
	style: "primary" | "secondary";
}) => {
	// Use the container with ? to position the tooltip on the screen absolutely
	const cRef = useRef(undefined);
	const tRef = useRef(undefined);
	const [pos, setPos] = useState<[number, number]>([0, 0]);
	const [wWidth, wHeight] = useWindowSize();

	useEffect(() => {
		if (!cRef.current || !tRef.current) return;

		const { top, left } = cRef.current.getBoundingClientRect();

		setPos([
			tooltipPos === "right"
				? left + cRef.current.offsetWidth
				: left - tRef.current.offsetWidth,
			top - tRef.current.clientHeight / 2 + cRef.current.clientHeight / 2,
		]);
	}, [
		cRef?.current?.getBoundingClientRect().top ?? 0,
		cRef?.current?.getBoundingClientRect().left ?? 0,
		tRef?.current?.clientHeight ?? 0,
		tRef?.current?.offsetWidth ?? 0,
		wWidth,
		wHeight,
	]);

	const posStyles = {
		left: styles.left,
		right: styles.right,
	};

	const varStyle = {
		primary: styles.primary,
		secondary: styles.secondary,
	};

	return (
		<div className={`${styles.qTooltip} ${varStyle[style]}`} ref={cRef}>
			<p>?</p>
			<div className={styles.tip} />
			<div
				className={`${styles.tooltip} ${posStyles[tooltipPos]}`}
				style={{ top: `${pos[1]}px`, left: `${pos[0]}px` }}
				ref={tRef}
			>
				{children}
			</div>
		</div>
	);
};
