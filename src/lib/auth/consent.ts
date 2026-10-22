import "server-only";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

type GateRow = { accepted: string | null; current: string | null };

/**
 * `unknown` is deliberately not folded into `satisfied`: the gate and the
 * consent screen ask in separate requests, so if a transient failure read as
 * "nothing to accept" on one side and "needs accepting" on the other, the user
 * would be bounced between `/admin` and `/auth/consent` until it settled.
 */
export type ConsentGate =
	| {
			status: "needed";
			version: string;
			/** The version they accepted before, or null if they never have. */
			previous: string | null;
	  }
	| { status: "satisfied" }
	| { status: "unknown" };

/**
 * Whether the signed-in user still has to accept the legal documents.
 *
 * One statement for both halves - the version stamped on their own row and the
 * version that is current - so an `/admin` navigation costs a single round trip.
 *
 * `satisfied` covers both "already accepted this version" and "there is nothing
 * to accept", the latter being an unset `private.settings.terms_version`:
 * `private.record_consents` refuses every acceptance in that state, so gating
 * on it would shut the user out of their own account with no way through.
 */
export async function needsConsentGate(
	me: VerifiedIdentity,
): Promise<ConsentGate> {
	try {
		const rows = await withUser(me, (tx) =>
			tx.execute<GateRow>(
				sql`select u.consents ->> 'version' as accepted,
				           private.current_terms_version() as current
				      from public.users u
				     where u.id = ${me.userId}`,
			),
		);
		const row = [...rows][0];
		// No row yet: provisioning is `getUserData`'s path, not the gate's.
		if (!row?.current) return { status: "satisfied" };
		return row.accepted === row.current
			? { status: "satisfied" }
			: {
					status: "needed",
					version: row.current,
					previous: row.accepted,
				};
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "needsConsentGate" },
		});
		return { status: "unknown" };
	}
}
