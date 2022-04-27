import { useRouter } from "next/router";
import { ReactElement, useState, useEffect } from "react";
import { IdeaDetailNavigatorLayout } from "../../../components/workspace/IdeaDetailNavigatorLayout";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * A sub-navigation context that allows a user to view basic information about
 * an idea, a list of proposals about the idea, a discussion board, and
 * market metrics about the idea.
 */
export const About = () => {
	// The address of the Idea contract will be provided in the URL
	const router = useRouter();

	return (
		<>
		</>
	);
};

// Using a wrapper guarantees that access to the currently selected idea's
// information will succeed
About.getLayout = (page: ReactElement) => <IdeaDetailNavigatorLayout>{ page }</IdeaDetailNavigatorLayout>;

export default About;
