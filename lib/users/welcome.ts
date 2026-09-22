import "server-only";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { sendWelcomeEmailSafely } from "@/lib/email/transactional";
import { withUser } from "@/utils/db";

/**
 * The welcome email, on the Supabase side.
 *
 * Under Clerk this was sent from the `user.created` webhook, which Supabase
 * Auth has no equivalent of: the sign-up trigger runs inside the transaction
 * that creates the row and must never do anything that can fail, or every
 * sign-up dies with "Database error saving new user".
 *
 * So the send moves into the app, and "exactly once" is enforced in the
 * database instead. `private.claim_welcome_email()` is a single statement:
 *
 *     update public.users set welcome_email_sent_at = now()
 *      where id = private.current_user_id() and welcome_email_sent_at is null
 *     returning email, name
 *
 * Two concurrent requests both run it; only one updates a row, so only one gets
 * an address back and only one email goes out. There is no read-then-write gap
 * to lose a race in.
 *
 * Imported users never receive one: `remap-user-ids.sql` backfills
 * `welcome_email_sent_at` from `created_at` during the re-key, so everybody who
 * already had an account is already claimed.
 *
 * The claim is committed before the email is sent, which makes this at-most-once
 * rather than exactly-once: a Resend outage costs somebody their welcome email.
 * That is the right way round — the alternative holds a database transaction
 * open across a network call, and the failure mode there is mailing the same
 * person repeatedly.
 */
export async function sendWelcomeEmailOnce(
	me: VerifiedIdentity,
): Promise<void> {
	let claimed: { email: string | null; name: string | null } | null = null;

	try {
		// Short transaction, closed before anything touches the network: an open
		// wrapper pins a pooled connection.
		const rows = await withUser(me, (tx) =>
			tx.execute<{ email: string | null; name: string | null }>(
				sql`select email, name from private.claim_welcome_email()`,
			),
		);
		claimed = [...rows][0] ?? null;
	} catch (err) {
		// A failed claim means no email and no stamp, so the next visit retries.
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "claimWelcomeEmail" },
		});
		return;
	}

	if (!claimed?.email) return;
	await sendWelcomeEmailSafely(claimed.email, claimed.name ?? "");
}
