import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/auth/cookie-options";

/**
 * Auth calls that must run on the server but be rate limited per **end user**:
 * the PKCE exchange at `/auth/callback` and `verifyOtp` at `/auth/confirm`.
 * Server calls come from shared Vercel egress IPs, so without forwarding one
 * busy region could exhaust the limit for everyone.
 *
 * It uses the secret key, because only that key's requests honour
 * `sb-forwarded-for`. A secret-key client also skips captcha and carries
 * `auth.admin`, so this module deliberately returns a narrow facade: nothing
 * else on `auth` is reachable through it, and the architecture test keeps its
 * importers to the two routes above.
 */
export type ForwardedAuth = Pick<
	SupabaseClient["auth"],
	"exchangeCodeForSession" | "verifyOtp" | "getClaims"
>;

export async function createForwardedAuthClient(): Promise<ForwardedAuth> {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw new Error("Supabase auth env is not set");

	const [jar, headerList] = await Promise.all([cookies(), headers()]);
	// Set by Vercel; the first entry is the client.
	const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();

	const client = createServerClient(url, key, {
		cookieOptions: COOKIE_OPTIONS,
		global: { headers: ip ? { "sb-forwarded-for": ip } : {} },
		cookies: {
			getAll: () => jar.getAll(),
			setAll: (list) => {
				for (const { name, value, options } of list) {
					jar.set(name, value, options);
				}
			},
		},
	});

	return {
		exchangeCodeForSession: (code: string) =>
			client.auth.exchangeCodeForSession(code),
		verifyOtp: (params: {
			type: "email" | "recovery" | "email_change";
			token_hash: string;
		}) => client.auth.verifyOtp(params),
		getClaims: () => client.auth.getClaims(),
	} as ForwardedAuth;
}
