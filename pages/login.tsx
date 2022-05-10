import styles from "./login.module.css";
import { provideWeb3 } from "../lib/util/web3";
import { accounts } from "../lib/util/networks";
import { useState, Dispatch, SetStateAction } from "react";
import LinearProgress from "@mui/material/LinearProgress";

const LOGIN_ATTESTATION = "Login_VisionECO";

/**
 * Generates a signature for the user's account, and attempts a refresh.
 */
const handleLogin = async (eth: any, setSigning: Dispatch<SetStateAction<boolean>>) => {
	setSigning(true);

	try {
		const signature = await eth.request({ method: "personal_sign", params: [LOGIN_ATTESTATION, (await accounts(eth))[0], ""] });
		document.cookie = `${LOGIN_ATTESTATION}=${signature};`;

		setSigning(false);

		refresh();
	} catch (e) {
		console.warn(e);

		setSigning(false);
	}
};

/**
 * Reloads the user's page.
 */
const refresh = () => {
	window.location.pathname = "/";
};

/**
 * A page that allows the user to login by signing, and saving to cookies, a
 * login token signature
 */
export const Login = () => {
	const ctx = provideWeb3();
	const [signing, setSigning] = useState<boolean>(false);

	return (
		<div className={ styles.loginContainer }>
			<img src="/Vision_Eye_Transparent.png" alt="Vision Eye Logo" className={ styles.mainLogo } />
			<p className={ styles.actionButton } onClick={ () => ctx ? handleLogin(ctx[1], setSigning) : refresh() }><b>(Beta)</b> Login with Metamask</p>
			{ signing && <LinearProgress className={ styles.progress } /> }
		</div>
	);
};

export default Login;
