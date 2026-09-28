import type { CookieOptions } from "@supabase/ssr";

/**
 * Attributes for the Supabase session cookies (`sb-<ref>-auth-token`), shared by
 * the browser, server and middleware clients so a cookie written by one is
 * readable and replaceable by the others.
 *
 * Deliberately NOT `httpOnly`: the browser client has to read the refresh token
 * to rotate it. The session's safety comes from `SameSite=Lax` plus a short
 * access-token lifetime and rotation, not from hiding the cookie from scripts.
 *
 * Host-only (no `domain`), so a sibling subdomain cannot set or read it.
 */
export const COOKIE_OPTIONS: CookieOptions = {
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	// 400 days is the maximum Chrome honours; the session's real lifetime is
	// enforced by Supabase, not by the cookie.
	maxAge: 400 * 24 * 60 * 60,
};

/** The session cookie's base name, derived from the project URL the app is pointed at. */
export function sessionCookieName(
	supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
): string {
	try {
		const host = new URL(supabaseUrl).hostname;
		return `sb-${host.split(".")[0]}-auth-token`;
	} catch {
		return "sb-auth-token";
	}
}
