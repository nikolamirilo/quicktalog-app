// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://04c218993c95f3450f8c7a08172075ff@o4511305257779200.ingest.us.sentry.io/4511305258762240",
	enabled: process.env.NODE_ENV === "production",

	// Performance traces sampled at 10% - representative slice, not every request.
	tracesSampleRate: 0.1,

	// Logs are a separate high-volume stream, not critical errors - off.
	enableLogs: false,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,

	// Drop non-actionable edge/middleware noise (control-flow + transient network).
	beforeSend(event, hint) {
		const err = hint?.originalException as
			| (Error & { code?: string; digest?: string })
			| undefined;
		if (err) {
			const digest = typeof err.digest === "string" ? err.digest : "";
			if (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND") {
				return null;
			}
			if (
				err.name === "AbortError" ||
				err.code === "ECONNRESET" ||
				err.code === "EPIPE" ||
				err.code === "ECONNREFUSED"
			) {
				return null;
			}
		}
		return event;
	},
});
