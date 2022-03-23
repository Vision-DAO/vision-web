import React from "react";
import { useState } from "react";
import NavPanel from "./workspace/nav/NavPanel";
import { NavItem } from "./workspace/nav/NavItem";
import "./App.css";

/**
 * A page navigable in the application.
 */
interface Page {
	label: string;
	icon: string;
	root: React.ReactElement,
}

// pages navigable through the main application
const pages: Page[] = [
	{
		label: "Explore",
		icon: "explore",
		root: <p>explore</p>,
	},
	{
		label: "My Ideas",
		icon: "menu",
		root: <p>my ideas</p>,
	},
	{
		label: "Following",
		icon: "visibility",
		root: <p>visibility</p>
	}
];

const App = () => {
	// The current item to display in the main body of the navigation workspace
	const [ctx, setCtx] = useState(pages[0].root);

	// Allow each navigable item to be switched to through the navbar
	const navItems = pages.map(({ label, icon, root }) =>
		<NavItem
			key={label}
			label={label}
			icon={icon}
			onActive={() => setCtx(root)}
		/>
	);

	return (
		<div className="app">
			<NavPanel
				items={navItems}
				onSettingsActive={() => alert("Settings")}
				onConnectRequested={() => alert("Connect?")}
			/>
			{ ctx }
		</div>
	);
};

export default App;
