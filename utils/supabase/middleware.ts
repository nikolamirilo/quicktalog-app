import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "@/lib/auth/cookie-options";

/**
 * The session refresher. Middleware is the only place that may write refreshed
 * session cookies, because a Server Component cannot set them.
 *
 * It uses the secret key with `sb-forwarded-for` so refreshes are rate limited
 * per end user rather than per Vercel egress IP.
 *
 * `response` must be the response that is actually returned: cookies are
 * written onto it as a side effect.
 */
export function createMiddlewareAuthClient(
	request: NextRequest,
	response: NextResponse,
) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key =
		process.env.SUPABASE_SECRET_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase auth env is not set");

	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

	return createServerClient(url, key, {
		cookieOptions: COOKIE_OPTIONS,
		global: { headers: ip ? { "sb-forwarded-for": ip } : {} },
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (list) => {
				for (const { name, value, options } of list) {
					request.cookies.set(name, value);
					response.cookies.set(name, value, options);
				}
			},
		},
	});
}
