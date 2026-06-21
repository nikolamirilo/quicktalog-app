// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://04c218993c95f3450f8c7a08172075ff@o4511305257779200.ingest.us.sentry.io/4511305258762240",
	enabled: process.env.NODE_ENV === "production",

	// Performance traces sampled at 10% — representative slice, not every request.
	tracesSampleRate: 0.1,

	// Logs are a separate high-volume stream, not critical errors — off.
	enableLogs: false,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,

	// Drop non-actionable server noise so only genuine errors reach triage.
	beforeSend(event, hint) {
		const err = hint?.originalException as
			| (Error & { code?: string; digest?: string })
			| undefined;
		if (err) {
			// Next.js control-flow "errors" — redirect()/notFound() throw to unwind
			// the render; they are not failures.
			const digest = typeof err.digest === "string" ? err.digest : "";
			if (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND") {
				return null;
			}
			// Transient network / aborted-request noise — not actionable.
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
