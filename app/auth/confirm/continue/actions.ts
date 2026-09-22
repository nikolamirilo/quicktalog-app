"use server";

import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { clientIp } from "@/lib/http/client-ip";
import { withinRateLimit } from "@/lib/rate-limit";
import { createForwardedAuthClient } from "@/utils/supabase/server-forwarded";

export type ConfirmResult =
	| { ok: true; email: string | null; next: string }
	| {
			ok: false;
			code: "rate_limited" | "signed_in" | "expired" | "link";
	  };

const TYPES = new Set(["email", "recovery", "email_change"]);

/**
 * Consumes the token the `/auth/confirm` link parked in `__Host-qt-confirm`.
 *
 * It runs only when the visitor presses "Confirm and continue": a link
 * prefetcher, a mail scanner or an image tag cannot spend the token.
 */
export async function confirmEmailToken(): Promise<ConfirmResult> {
	// Redis first, before any cookie or network work.
	if (!(await withinRateLimit("confirm", await clientIp()))) {
		return { ok: false, code: "rate_limited" };
	}

	// Login CSRF: an attacker who gets a victim to open their confirmation link
	// would otherwise silently swap the victim's session for the attacker's
	// account. Verifying only from a signed-out browser makes the swap
	// impossible; the page tells the user to sign out and open the link again.
	if (await getVerifiedIdentity()) return { ok: false, code: "signed_in" };

	const jar = await cookies();
	const raw = jar.get("__Host-qt-confirm")?.value;
	// One attempt per link: the cookie goes whether or not the token verifies.
	jar.delete("__Host-qt-confirm");
	if (!raw) return { ok: false, code: "expired" };

	let hash: string;
	let type: "email" | "recovery" | "email_change";
	try {
		const parsed = JSON.parse(raw) as { h?: unknown; t?: unknown };
		if (typeof parsed.h !== "string" || typeof parsed.t !== "string") {
			return { ok: false, code: "link" };
		}
		if (!TYPES.has(parsed.t)) return { ok: false, code: "link" };
		hash = parsed.h;
		type = parsed.t as typeof type;
	} catch {
		return { ok: false, code: "link" };
	}

	try {
		// Narrow facade (B.7): verifyOtp with the visitor's IP forwarded, and no
		// way to reach a captcha-gated or admin call through the secret key.
		const auth = await createForwardedAuthClient();
		const { data, error } = await auth.verifyOtp({ type, token_hash: hash });
		if (error || !data.user) return { ok: false, code: "link" };

		return {
			ok: true,
			email: data.user.email ?? null,
			next: type === "recovery" ? "/auth/update-password" : "/admin/dashboard",
		};
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "confirmEmailToken" } });
		return { ok: false, code: "link" };
	}
}
