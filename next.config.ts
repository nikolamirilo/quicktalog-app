import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Keep these heavy native packages out of the webpack bundle so they are
	// required at runtime instead of being parsed/memoized into the build graph.
	serverExternalPackages: ["puppeteer", "tesseract.js", "playwright"],
	images: {
		minimumCacheTTL: 2678400,
		formats: ["image/webp"],
		unoptimized: !process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost"),
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
		// withSentryConfig injects a custom webpack config, which makes Next skip the
		// build worker by default. Without it the main process keeps the whole webpack
		// compilation in memory through type-checking and page-data collection, which
		// OOMs Vercel's 8 GB build container.
		webpackBuildWorker: true,
		webpackMemoryOptimizations: true,
	},
	// turbopack: {
	// 	root: process.cwd(),
	// },
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

export default withSentryConfig(nextConfig, {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "quicktalog",

	project: "javascript-nextjs",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time/memory).
	// Disabled by default to avoid OOMing Vercel's 8 GB Hobby build container; enable on Pro/Enterprise.
	widenClientFileUpload: process.env.SENTRY_WIDEN_CLIENT_FILE_UPLOAD === "true",

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	webpack: {
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,

		// Tree-shaking options for reducing bundle size
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
	},
});
