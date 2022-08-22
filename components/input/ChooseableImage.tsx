import { ImgHTMLAttributes, ChangeEvent, useState } from "react";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import styles from "./ChooseableImage.module.css";
import { blobify } from "../../lib/util/blobify";

interface ChooseableImageProps {
	src: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	editing: boolean;
}

export type AllChooseableImageProps = ChooseableImageProps &
	Omit<Omit<ImgHTMLAttributes<HTMLImageElement>, "src">, "onChange">;

/**
 * Displays a current image, and allows the user to replace it by clicking on
 * it, and selecting a file from their computer.
 */
export const ChooseableImage = ({
	src,
	onChange,
	editing,
	...imageProps
}: AllChooseableImageProps) => {
	const [liveSrc, setSrc] = useState(null);

	if (editing && liveSrc === null) setSrc(src);
	if (!editing && liveSrc !== null) setSrc(null);

	const { width, height, ...imgProps } = imageProps;
	const img = (
		<img
			src={editing ? liveSrc : src}
			width="100%"
			height="100%"
			{...imgProps}
		/>
	);

	if (!editing) return img;

	const updateAndChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files.length === 0) return;

		const fr = new FileReader();
		fr.onload = () => {
			if (typeof fr.result === "string") setSrc(fr.result);
		};
		fr.readAsDataURL(e.target.files[0]);

		onChange(e);
	};

	return (
		<div
			className={styles.container}
			style={{
				width: imageProps.width,
				height: imageProps.height,
			}}
		>
			<input type="file" onChange={updateAndChange} />
			<div className={styles.chooseButton}>
				<PhotoCameraRoundedIcon fontSize="large" />
			</div>
			{img}
		</div>
	);
};
