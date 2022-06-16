import { Html, Head, Main, NextScript } from "next/document";

export const Document = () => {
	return (
		<Html lang="en">
			<Head>
				<meta charSet="utf-8" />
				<link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
				<meta name="theme-color" content="#000000" />
				<meta
					name="vision.eco"
					content="Browser for the Vision marketplace of ideas"
				/>
				<link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
				<link rel="manifest" href="/manifest.json" />
				<link rel="stylesheet" href="/style.css" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
				<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&family=Roboto:wght@400;700&family=UnifrakturMaguntia&display=swap" rel="stylesheet" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
};

export default Document;
