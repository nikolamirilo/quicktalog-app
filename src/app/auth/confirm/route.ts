import { type NextRequest, NextResponse } from "next/server";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * Where every auth email link lands (`{{ .RedirectTo }}/auth/confirm?token_hash=...&type=...`).
 *
 * It verifies nothing. It only moves the one-time token out of the URL into a
 * short-lived HttpOnly cookie and shows an interstitial, so the token cannot
 * leak through the Referer header, the browser history, a shared link or an
 * analytics script, and so a link opened by a mail scanner does not consume it.
 */

// Writes a cookie per request; nothing here is cacheable.
export const dynamic = "force-dynamic";

const TYPES = new Set(["email", "recovery", "email_change"]);
const TOKEN_HASH = /^[A-Za-z0-9_-]{16,128}$/;

export async function GET(req: NextRequest) {
	if (AUTH_PROVIDER !== "supabase") {
		return new NextResponse(null, { status: 404 });
	}

	const { origin, searchParams } = req.nextUrl;
	const hash = searchParams.get("token_hash");
	const type = searchParams.get("type");
	const fail = NextResponse.redirect(new URL("/auth?error=link", origin));
	if (!hash || !TOKEN_HASH.test(hash) || !type || !TYPES.has(type)) return fail;

	// 303 so the browser follows with a GET and drops the token from the address bar.
	const res = NextResponse.redirect(
		new URL("/auth/confirm/continue", origin),
		303,
	);
	res.cookies.set("__Host-qt-confirm", JSON.stringify({ h: hash, t: type }), {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});
	return res;
}
