import "server-only";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { sendWelcomeEmailSafely } from "@/lib/email/transactional";
import { withUser } from "@/utils/db";

/**
 * The welcome email, on the Supabase side. Supabase Auth has no `user.created`
 * webhook (the sign-up trigger runs inside the row-creating transaction and
 * must never fail), so the send moves into the app and "exactly once" is
 * enforced by `private.claim_welcome_email()`:
 *
 *     update public.users set welcome_email_sent_at = now()
 *      where id = private.current_user_id() and welcome_email_sent_at is null
 *     returning email, name
 *
 * Only one of two concurrent requests can update the row, so only one email
 * goes out - no read-then-write race. Imported users are pre-claimed by
 * `remap-user-ids.sql`. The claim commits before the send, making this
 * at-most-once: a Resend outage skips an email rather than risking a resend
 * loop across an open transaction.
 */
export async function sendWelcomeEmailOnce(
	me: VerifiedIdentity,
): Promise<void> {
	let claimed: { email: string | null; name: string | null } | null = null;

	try {
		// Short transaction, closed before anything touches the network.
		const rows = await withUser(me, (tx) =>
			tx.execute<{ email: string | null; name: string | null }>(
				sql`select email, name from private.claim_welcome_email()`,
			),
		);
		claimed = [...rows][0] ?? null;
	} catch (err) {
		// No claim, no stamp: the next visit retries.
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "claimWelcomeEmail" },
		});
		return;
	}

	if (!claimed?.email) return;
	await sendWelcomeEmailSafely(claimed.email, claimed.name ?? "");
}
