import "server-only";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import { withPublic } from "@/utils/db";

/**
 * The terms version a new account is signed up against. It lives only in
 * `private.settings.terms_version` (never in an env var), so the sign-up form
 * receives it as a server-rendered prop instead of guessing one in the browser.
 *
 * `private.current_terms_version()` is a definer function granted to
 * `app_public`, which is why this read needs no identity.
 *
 * Returns null when the value cannot be read: `private.record_consents()`
 * rejects a stale version, so a wrong guess would store a consent nobody can
 * honour. The form disables sign-up instead.
 */
export async function currentTermsVersion(): Promise<string | null> {
	try {
		const rows = await withPublic((tx) =>
			tx.execute<{ version: string | null }>(
				sql`select private.current_terms_version() as version`,
			),
		);
		const version = [...rows][0]?.version;
		if (typeof version !== "string" || version.length === 0) {
			// A missing row throws nothing, so without this it is reported nowhere:
			// email sign-up turns itself off, the consent gate goes inert, and
			// Google sign-ups land with no recorded acceptance of anything.
			Sentry.captureMessage("private.settings.terms_version is not set", {
				level: "error",
				tags: { op: "currentTermsVersion" },
			});
			return null;
		}
		return version;
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "currentTermsVersion" },
		});
		return null;
	}
}
