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

		ignoreErrors: [
			"Paddle.js not available",
			/UploadThingError: Failed to report event "upload"/,
			"An unexpected response was received from the server.",
			/surveys\.js/,
		],

		// Browser auto-translation (Edge/Chrome) reparents text nodes into <font>
		// wrappers, which makes React's stored DOM references stale during
		// unmount. React 19 already recovers from this on its own, so the noisy
		// NotFoundError it throws is not actionable.
		beforeSend(event, hint) {
			const err = hint?.originalException as
				| (Error & { name?: string; stack?: string; error?: any })
				| undefined;
			if (err) {
				const message = err.message ?? "";
				const stack = err.stack ?? "";
				if (
					err.name === "NotFoundError" &&
					(message.includes("removeChild") ||
						message.includes("insertBefore")) &&
					/react-dom/.test(stack)
				) {
					return null;
				}

				if (
					err?.error?.type === "network_error" ||
					err?.error?.code === "network_error"
				) {
					return null;
				}

				if (message.includes("Paddle.js not available")) {
					return null;
				}

				if (
					message.includes('UploadThingError: Failed to report event "upload"')
				) {
					return null;
				}

				if (err.name === "SyntaxError" && /surveys\.js/.test(stack)) {
					return null;
				}

				if (
					message.includes(
						"An unexpected response was received from the server.",
					) &&
					/server-action-reducer/.test(stack)
				) {
					return null;
				}
			}
			return event;
		},
	});
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
