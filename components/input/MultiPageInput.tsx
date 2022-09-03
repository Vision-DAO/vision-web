import { ReactElement, useState } from "react";
import styles from "./MultiPageInput.module.css";
import { FilledButton } from "../status/FilledButton";
import { OutlinedButton } from "../status/OutlinedButton";
import { StepBar } from "../status/StepBar";
import NavigateNextIcon from "@mui/icons-material/NavigateNextRounded";
import DoneIcon from "@mui/icons-material/DoneRounded";
import NavigatePrevIcon from "@mui/icons-material/NavigateBeforeRounded";
import { CircularProgress } from "@mui/material";

/**
 * A form that renders each of its children on separate pages.
 */
export const MultiPageInput = ({
	children,
	labels,
	onSubmit,
}: {
	children: ReactElement[];
	labels: string[];
	onSubmit: () => Promise<void>;
}) => {
	const [step, setStep] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(false);

	const onClick = () => {
		if (step < children.length - 1) {
			setStep((step) => step + 1);

			return;
		}

		setLoading(true);
		onSubmit().then(() => {
			setLoading(false);
		});
	};

	return (
		<div className={styles.stepContainer}>
			{children[step]}
			<div className={styles.row}>
				<div className={styles.stepLabel}>
					<p>{step + 1}</p>
				</div>
				<p>{labels[step]}</p>
			</div>
			<StepBar
				step={step}
				nSteps={children.length}
				style={{ width: "100%", marginTop: "0.75em" }}
			/>
			<div className={`${styles.row} ${styles.full} ${styles.navRow}`}>
				<OutlinedButton
					className={`${styles.navButton} ${styles.prevButton} ${
						step === 0 ? styles.hidden : ""
					}`}
					callback={() => setStep((step) => step - 1)}
				>
					<NavigatePrevIcon />
					<p>Prev</p>
				</OutlinedButton>
				<FilledButton
					className={`${styles.button} ${styles.nextButton} ${styles.navButton}`}
					onClick={() => onClick()}
				>
					{loading
						? [
								<p style={{ marginRight: "0.5em" }}>Loading</p>,
								<CircularProgress size="1.25em" />,
						  ]
						: step < children.length - 1
						? [<p>Next</p>, <NavigateNextIcon />]
						: [<p>Done</p>, <DoneIcon />]}
				</FilledButton>
			</div>
		</div>
	);
};
