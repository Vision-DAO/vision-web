import { useState, useEffect } from "react";

const icons = ["bottom", "top"];
const opacities = [1.00, 0.00];

/**
 * An animated loading indicator in the shape of an hourglass that flips every 300ms
 **/
const Loading = ({ interval = 1000 }: { interval?: number }) => {
	const [step, setStep] = useState(0);
	const [[opacity, incr, target], setOpacity] = useState([1.00, -0.1, 1]);

	// Flips the hourglass icon every n milliseconds,
	// and fade it in and out every n/2 milliseconds
	useEffect(() => {
		const fader = setTimeout(() => {
			if (opacity == opacities[target])
				setOpacity([opacity + incr, incr * -1, target + 1 % opacities.length]);
			else
				setOpacity([opacity + incr, incr, target]);
		}, interval / 2);

		const flipper = setTimeout(() => {
			setStep(step + 1 % icons.length);
		}, interval);

		// Stops flipping after the component is gone
		return () => {
			clearInterval(flipper);
			clearInterval(fader);
		};
	});

	return (
		<h1 className="material-icons-round hourglass-animated" style={{opacity: opacity}}>
			{icons[step]}
		</h1>
	);
};

export default Loading;
