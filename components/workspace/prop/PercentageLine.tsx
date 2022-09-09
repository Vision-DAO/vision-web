import styles from "./PercentageLine.module.css";

export const PercentageLine = ({ percentage }: { percentage: number }) => {
	return (
		<div className={styles.percentageContainer}>
			<div className={styles.labelRow}>
				<p className={styles.label}>0%</p>
				<p className={styles.label}>50%</p>
				<p className={styles.label}>100%</p>
			</div>
			<div className={styles.blockContainer}>
				<div className={styles.leftMarker} />
				<div className={styles.rightMarker} />
				<div className={styles.lineContainer}>
					<div
						className={styles.yesLine}
						style={{ width: `${percentage * 100}%` }}
					/>
					<div
						className={styles.noLine}
						style={{ width: `${(1 - percentage) * 100}%` }}
					/>
				</div>
			</div>
		</div>
	);
};
