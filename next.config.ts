import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		minimumCacheTTL: 2678400,
		formats: ["image/webp"],
		unoptimized: !process.env.NEXT_PUBLIC_BASE_URL.includes("localhost"),
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
			{
				protocol: "http",
				hostname: "**",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/api/:path*", // Apply to all API routes
				headers: [
					{ key: "Access-Control-Allow-Credentials", value: "true" },
					{
						key: "Access-Control-Allow-Origin",
						value: "*",
					},
					{
						key: "Access-Control-Allow-Methods",
						value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
					},
					{
						key: "Access-Control-Allow-Headers",
						value:
							"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
					},
				],
			},
		];
	},
	experimental: {
		optimizePackageImports: ["react-icons"],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
			{
				source: "/ingest/flags",
				destination: "https://eu.i.posthog.com/flags",
			},
		];
	},
	skipTrailingSlashRedirect: true,
	logging: false,
};

export default nextConfig;
