import { NextRequest, NextResponse } from "next/server";
import Web3 from "web3";

/**
 * Signed data indicating the user is who they say they are.
 */
export const LOGIN_ATTESTATION = "Login_VisionECO";

/**
 * Accounts pre-approved for Vision usage.
 */
const whitelist: Set<string> = new Set([
	"0x928613da9dE038458c29fe34066fbbDe74A2DB9f",
	"0x44A3Bc524b80a50ABb252f1ffBeDF21Dba50445C",
	"0xecDd164e108EE04736EE264e00B7a024267fc62b",
	"0xdc36FA7961324b2403e4DD8B9c3bdd27c725E693",
	"0x40c519d4dfc6B426B0285CC78f05c958708c88b2",
	"0xCf457e101EF999C95c6563A494241D9C0aD8763B",
	"0xc32dC5713162479dfD0e0B7E54780DcF23A58fc7",
	"0x9405c86c9021F068b5d2a7a6A818c34A85252f23"
]);

/**
 * A global server-side web3 instance used for validating account identities.
 */
const web3 = new Web3("https://nd-333-212-679.p2pify.com/b3780ceca4a0bb12fd62cbecd480efef");

export const middleware = async (req: NextRequest) => {
	// TODO: Abstract this
	if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/Vision_Eye_Transparent.png")
		return;

	const signature = req.cookies[LOGIN_ATTESTATION];

	// Check that the user is an authenticated user
	if (signature &&
		whitelist.has(await web3.eth.personal.ecRecover(LOGIN_ATTESTATION, signature))
	) {
		return;
	}

	// NextJS requires absolute path
	const url = req.nextUrl.clone();
	url.pathname = "/login";

	// Redirect the user to the login page.
	return NextResponse.redirect(url);
};
