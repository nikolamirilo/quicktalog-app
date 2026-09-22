import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/auth/cookie-options";

/**
 * Server-side Supabase client for **auth only**: reading the session's claims
 * and, in a route handler, writing refreshed cookies. Data never goes through
 * it — see `utils/db` for that.
 *
 * In a Server Component the cookie jar is read-only, so `setAll` throws; that
 * is expected and ignored, because middleware is what refreshes the session.
 */
export async function createClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase auth env is not set");

	const cookieStore = await cookies();
	return createServerClient(url, key, {
		cookieOptions: COOKIE_OPTIONS,
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Called from a Server Component, where cookies are read-only.
					// Middleware refreshes the session instead.
				}
			},
		},
	});
}
