import styles from "./StepBar.module.css";
import { HTMLProps } from "react";

/**
 * You passed the bar
 */
export const StepBar = ({
	step,
	nSteps,
	onClickStep,
	style,
}: {
	step: number;
	nSteps: number;
	onClickStep: (step: number) => void;
	style?: HTMLProps<HTMLDivElement>["style"];
}) => {
	return (
		<div className={styles.bar} style={style ?? {}}>
			{[...Array(nSteps).keys()].map((_, i) => {
				let style = styles.todo;

				if (i < step) style = styles.done;
				else if (i === step) style = styles.doing;

				return (
					<div
						className={`${styles.barPart} ${style}`}
						key={i}
						onClick={() => onClickStep(i)}
						style={{ width: `${(1 / nSteps) * 100}%`, height: "0.5em" }}
					/>
				);
			})}
		</div>
	);
};
