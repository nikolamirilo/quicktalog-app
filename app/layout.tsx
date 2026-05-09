import ClarityScript from "@/components/scripts/ClarityScript";
import { PageWrapperClient } from "@/components/wrappers/PageWrapperClient";
import { generatePageMetadata } from "@/constants/metadata";
import {
	crimsonText,
	dmSans,
	inter,
	josefinSans,
	lato,
	loraRegular,
	loraSemiBold,
	merriweather,
	montserrat,
	nunito,
	openSans,
	oswald,
	playfairDisplay,
	poppins,
	raleway,
	roboto,
	robotoSlab,
	sourceSans3,
	workSans,
} from "@/fonts";
import { GoogleTagManager } from "@next/third-parties/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import type { Metadata } from "next";
import { extractRouterConfig } from "uploadthing/server";
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
			className={`${loraRegular.variable} ${loraSemiBold.variable} ${playfairDisplay.variable} ${inter.variable} ${nunito.variable} ${crimsonText.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${lato.variable} ${raleway.variable} ${oswald.variable} ${merriweather.variable} ${robotoSlab.variable} ${sourceSans3.variable} ${workSans.variable} ${dmSans.variable} ${josefinSans.variable} antialiased`}
			lang="en"
		>
			<head>
				<ClarityScript />
				<GoogleTagManager gtmId={process.env.GTM_ID} />
			</head>
			<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
			<body className="product" suppressHydrationWarning>
				<PageWrapperClient children={children} />
			</body>
		</html>
	);
}
