import { ReactElement, useContext, useState, useEffect } from "react";
import styles from "./GeneralModal.module.css";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { ModalContext } from "../../lib/util/modal";

/**
 * Displays a closeable modal with a header, and some child content.
 */
export const GeneralModal = ({ title, children }: { title: string, children: ReactElement }) => {
	const [, setModal] = useContext(ModalContext);
	const [active, setActive] = useState(undefined);

	// Transition in the modal after it has been mounted
	useEffect(() => {
		if (active === undefined)
			setActive(true);
	});

	// Transition out the modal over 300 ms
	const closeModal = () => {
		setActive(false);

		setTimeout(() => {
			setModal(undefined);
		}, 300);
	};

	return (
		<div className={ `${styles.modalContainer} ${ active ? styles.active : "" }` }>
			<div className={ styles.modalContent }>
				<div className={ styles.modalTitle }>
					<h1>{ title }</h1>
					<CloseRounded fontSize="large" onClick={ closeModal } />
				</div>
				{ children }
			</div>
		</div>
	);
};
