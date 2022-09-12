import { ReactElement, useState, useEffect } from "react";
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
	pageSetter,
}: {
	children: ReactElement[];
	labels: ReactElement[] | ReactElement;
	onSubmit: () => Promise<void>;
	pageSetter?: (pageSetter: (page: number) => void) => void;
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

	useEffect(() => {
		if (pageSetter)
			pageSetter((page) => {
				setStep(page);
			});
	}, []);

	return (
		<div className={styles.stepDisplay}>
			{children.map((currStep, i) => (
				<div
					key={i}
					className={styles.stepContainer}
					style={
						i === step
							? { opacity: "100%", zIndex: "2" }
							: { opacity: "0%", pointerEvents: "none" }
					}
				>
					{currStep}
				</div>
			))}
			{Array.isArray(labels) ? (
				<div className={styles.row}>
					<div className={styles.stepLabel}>
						<p>{step + 1}</p>
					</div>
					{labels[step]}
				</div>
			) : (
				labels
			)}

			<StepBar
				step={step}
				nSteps={children.length}
				onClickStep={(step) => setStep(step)}
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
								<p key="label" style={{ marginRight: "0.5em" }}>
									Loading
								</p>,
								<CircularProgress size="1.25em" key="load" />,
						  ]
						: step < children.length - 1
						? [
								<p key="label-next">Next</p>,
								<NavigateNextIcon key="icon-next" />,
						  ]
						: [<p key="label-done">Done</p>, <DoneIcon key="icon-done" />]}
				</FilledButton>
			</div>
		</div>
	);
};
