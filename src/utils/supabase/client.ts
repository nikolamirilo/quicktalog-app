"use client";

import { createBrowserClient } from "@supabase/ssr";
import { COOKIE_OPTIONS } from "@/lib/auth/cookie-options";

/**
 * The browser client. Used for sign-in, sign-up, password reset, OAuth start
 * and credential changes — never for data: every table is closed to the
 * publishable key, so a `.from()` here would only ever return a permission
 * error.
 *
 * These calls are rate limited by Supabase per end-user IP, which is the reason
 * they run in the browser rather than on a server with shared egress IPs.
 */
export function createClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase auth env is not set");

	return createBrowserClient(url, key, { cookieOptions: COOKIE_OPTIONS });
}
