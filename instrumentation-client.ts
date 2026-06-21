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

		// Performance traces are sampled at 10% — we only need a representative
		// slice, not every transaction (the bulk of event volume/cost).
		tracesSampleRate: 0.1,
		// Logs are a separate high-volume stream, not critical errors — off.
		enableLogs: false,

		// Don't record replays for every session; only attach a replay when an
		// actual error occurs (see replaysOnErrorSampleRate below).
		replaysSessionSampleRate: 0,

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
			// Browser auto-translation (Chrome/Edge) reparenting DOM nodes.
			"The node to be removed is not a child of this node",
			"The node before which the new node is to be inserted is not a child of this node",
			// In-app WebView / browser-extension injected globals (not our code).
			"Java object is gone",
			/messageHandlers/,
			"__firefox__",
			/window\.ethereum/,
			"NS_ERROR_FAILURE",
			// Clerk CDN script-load failures (transient / blockers).
			/Failed to load Clerk/i,
			"failed_to_load_clerk_js",
			// Paddle price-preview transient network failures.
			"PricePreview.failed",
		],

		denyUrls: [
			// Injected in-app WebView bridge scripts (Android/iOS) load from app://.
			/^app:\/\//,
		],

		// `beforeSend` only handles cases that `ignoreErrors`/`denyUrls` can't
		// express — object-shape checks, stack-gated matches, and severity
		// downgrades. Plain message/URL drops live in those lists above (they run
		// first, so duplicating them here would be dead code).
		beforeSend(event, hint) {
			const err = hint?.originalException as
				| (Error & { name?: string; stack?: string; error?: any })
				| undefined;
			if (err) {
				const message = err.message ?? "";
				const stack = err.stack ?? "";

				// Paddle price-preview / SDK network blips. The object-shape checks
				// can't be matched by `ignoreErrors` (message text only).
				if (
					err?.error?.type === "network_error" ||
					err?.error?.code === "network_error" ||
					/Network error encountered when calling Paddle/.test(message)
				) {
					return null;
				}

				// Third-party survey script syntax errors — gated on the *stack*
				// (the message rarely names surveys.js), so not expressible in
				// `ignoreErrors`.
				if (err.name === "SyntaxError" && /surveys\.js/.test(stack)) {
					return null;
				}

				// "Failed to fetch" on the server-action path is usually a
				// navigation/offline abort, but it also covers real transport
				// failures (CORS, edge 5xx, DNS). Don't drop it outright — collapse
				// it into one info-level issue so a deploy that genuinely breaks
				// server actions still shows as a volume spike. Mute this issue in
				// Sentry to keep the steady-state noise out of triage.
				if (
					message.includes("Failed to fetch") &&
					/server-action-reducer/.test(stack)
				) {
					event.level = "info";
					event.fingerprint = ["server-action-fetch-failed"];
					return event;
				}
			}
			return event;
		},
	});
}
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
