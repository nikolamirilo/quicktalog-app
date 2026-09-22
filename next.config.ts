import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	env: {
		// One source for the auth provider switch, inlined for server and client.
		NEXT_PUBLIC_AUTH_PROVIDER:
			process.env.AUTH_PROVIDER === "supabase" ? "supabase" : "clerk",
	},
	// Keep these heavy native packages out of the webpack bundle so they are
	// required at runtime instead of being parsed/memoized into the build graph.
	serverExternalPackages: ["tesseract.js", "playwright"],
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
	experimental: {
		optimizePackageImports: ["react-icons"],
		// withSentryConfig injects a custom webpack config, which makes Next skip the
		// build worker by default. Without it the main process keeps the whole webpack
		// compilation in memory through type-checking and page-data collection, which
		// OOMs Vercel's 8 GB build container.
		webpackBuildWorker: true,
		webpackMemoryOptimizations: true,
	},
	/**
	 * Report-only for now: it collects violations without breaking anything, so
	 * the allowlist can be corrected before it is enforced. Every third-party
	 * script the app loads has to be listed, and `unsafe-inline`/`unsafe-eval`
	 * stay until GTM and the analytics snippets are moved to nonces.
	 *
	 * `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'self'` are
	 * the parts that already matter: they stop plugin embedding, base-tag
	 * hijacking and clickjacking.
	 */
	async headers() {
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://challenges.cloudflare.com https://*.paddle.com https://cdn.paddle.com",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' data: https://fonts.gstatic.com",
			"img-src 'self' data: blob: https:",
			"media-src 'self' blob: https:",
			"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://clerk.quicktalog.app https://*.ingest.sentry.io https://*.posthog.com https://*.clarity.ms https://*.google-analytics.com https://*.googletagmanager.com https://*.paddle.com https://*.uploadthing.com https://uploadthing.com https://api.deepseek.com",
			"frame-src 'self' https://challenges.cloudflare.com https://*.paddle.com https://*.clerk.accounts.dev",
			"worker-src 'self' blob:",
			"object-src 'none'",
			"base-uri 'self'",
			"frame-ancestors 'self'",
			"form-action 'self'",
		].join("; ");

		return [
			{
				source: "/:path*",
				headers: [{ key: "Content-Security-Policy-Report-Only", value: csp }],
			},
		];
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
