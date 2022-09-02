import { IdeaMetadataDisplay } from "./prevwindow/IdeaMetadataDisplay";
import { VisionaryListDisplay } from "./prevwindow/VisionaryListDisplay";
import { VisualDisplaySelector } from "../../status/VisualDisplaySelector";
import InfoRounded from "@mui/icons-material/InfoRounded";
import {
	loadIdeaBinaryData,
	IpfsContext,
	IpfsStoreContext,
	IdeaData,
} from "../../../lib/util/ipfs";
import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import { useState, useEffect, useContext } from "react";
import { GetDaoAboutQuery } from "../../../.graphclient";

export const IdeaVisualInfoWindow = ({
	idea,
}: {
	idea: GetDaoAboutQuery["idea"];
}) => {
	const [ipfsCache, setIpfsCache] = useContext(IpfsStoreContext);
	const ipfs = useContext(IpfsContext);

	// Binary data stored on IPFS about the idea
	const [data, setData] = useState<IdeaData[]>([]);

	useEffect(() => {
		if (idea.ipfsAddr in ipfsCache && "all" in ipfsCache[idea.ipfsAddr]) {
			setData(ipfsCache[idea.ipfsAddr]["all"] as IdeaData[]);

			return;
		}

		(async () => {
			const data = await loadIdeaBinaryData(ipfs, idea.ipfsAddr);
			setIpfsCache(idea.ipfsAddr, "all", data);
			setData(data);
		})();
	}, [idea.ipfsAddr]);

	// The visual display for an idea has multiple tabs:
	const availableViews = {
		Info: {
			content: <IdeaMetadataDisplay data={data} />,
			navIcon: <InfoRounded fontSize="large" />,
		},
		Visionaries: {
			content: <VisionaryListDisplay idea={idea} />,
			navIcon: <AccountCircleRounded fontSize="large" />,
		},
	};

	// Display the information for the currently active view
	return <VisualDisplaySelector displays={availableViews} />;
};
