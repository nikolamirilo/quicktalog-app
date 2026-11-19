import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Quicktalog - Digital CatalogueBuilder",
		short_name: "Quicktalog",
		description:
			"Create stunning digital catalogues in minutes with our free online catalogue maker. Perfect for restaurants, salons, gyms, retail & more. No code required, mobile-friendly, QR code sharing.",
		theme_color: "#000000",
		categories: [
			"digital catalogue",
			"online catalogue maker",
			"business tools",
			"e-commerce",
			"restaurant menu",
			"product catalogue",
			"service catalogue",
			"qr code",
			"mobile catalogue",
			"catalogue builder",
		],
		background_color: "#ffffff",
		start_url: "/",
		display: "standalone",
		orientation: "portrait",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
			{
				src: "/images/brand/logo.svg",
				sizes: "any",
				type: "image/svg+xml",
			},
			{
				src: "/images/brand/opengraph-image.png",
				sizes: "1200x630",
				type: "image/png",
			},
			{
				src: "/images/brand/twitter-image.png",
				sizes: "1200x630",
				type: "image/png",
			},
			{
				src: "/images/brand/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/images/brand/icon-512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
