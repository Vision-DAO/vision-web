import { HTMLAttributes, useState, useEffect, useRef } from "react";

export type DimProps = Omit<
	Omit<HTMLAttributes<HTMLDivElement>, "height">,
	"width"
>;

interface WidthSized extends DimProps {
	width: number | string;
	height?: never;
}

interface HeightSized extends DimProps {
	width?: never;
	height: number | string;
}

export type AllEqDimProps = WidthSized | HeightSized;

/**
 * Places its children in a container with an equal height and width.
 */
export const EqDimContainer = ({ children, ...props }: AllEqDimProps) => {
	const [otherDim, setOtherDim] = useState(
		"height" in props ? props.height : props.width
	);
	const container = useRef(null);

	useEffect(() => {
		if (container.current === null) return;

		const handleResize = () => {
			if (container.current === null) return;

			if ("height" in props) setOtherDim(container.current.clientHeight);
			else setOtherDim(container.current.clientWidth);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
	});

	let containerProps: DimProps;

	if ("height" in props) {
		containerProps = {
			style: { width: `${otherDim}px`, height: props.height },
			...props,
		};
	} else {
		containerProps = {
			style: { height: `${otherDim}px`, width: props.width },
			...props,
		};
	}

	return (
		<div ref={container} {...containerProps}>
			{children}
		</div>
	);
};
