import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		defaults: "2025-05-24",
		autocapture: false,
		capture_pageleave: false,
		capture_pageview: true,
		rageclick: false,
		capture_dead_clicks: false,
		capture_performance: false,
		capture_exceptions: false,
		capture_heatmaps: false,
		disable_session_recording: true,
	});
}
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		enabled: process.env.NODE_ENV === "production",

		// Add optional integrations for additional features
		integrations: [Sentry.replayIntegration()],

		// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
		tracesSampleRate: 1,
		// Enable logs to be sent to Sentry
		enableLogs: true,

		// Define how likely Replay events are sampled.
		// This sets the sample rate to be 10%. You may want this to be 100% while
		// in development and sample at a lower rate in production
		replaysSessionSampleRate: 0.1,

		// Define how likely Replay events are sampled when an error occurs.
		replaysOnErrorSampleRate: 1.0,

		// Enable sending user PII (Personally Identifiable Information)
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
		sendDefaultPii: true,
	});
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
