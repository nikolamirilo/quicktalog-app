import { GoogleTagManager } from "@next/third-parties/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { extractRouterConfig } from "uploadthing/server";
import ClarityScript from "@/components/analytics/ClarityScript";
import { PageWrapperClient } from "@/components/wrappers/PageWrapperClient";
import { generatePageMetadata } from "@/constants/metadata";
import {
	crimsonText,
	inter,
	loraRegular,
	loraSemiBold,
	nunito,
	playfairDisplay,
	poppins,
} from "@/fonts";
import { ourFileRouter } from "./api/items/uploadthing/core";
import "./globals.css";

export const metadata: Metadata = generatePageMetadata("home");

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			className={`${loraRegular.variable} ${loraSemiBold.variable} ${playfairDisplay.variable} ${inter.variable} ${nunito.variable} ${crimsonText.variable} ${poppins.variable} antialiased`}
			lang="en"
		>
			<head>
				<ClarityScript />
				<GoogleTagManager gtmId={process.env.GTM_ID} />
				<script type="text/javascript" id="hs-script-loader" async defer src="//js-eu1.hs-scripts.com/146895463.js"></script>
			</head>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<body className="product">
				<PageWrapperClient children={children} />
			</body>
		</html>
	);
}
