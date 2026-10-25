import { type NextRequest, NextResponse } from "next/server";
import { identityFromSupabaseAuth } from "@/lib/auth/identity";
import { safeNext } from "@/lib/auth/redirects";
import { sessionCookieName } from "@/lib/auth/cookie-options";
import { createMiddlewareAuthClient } from "@/utils/supabase/middleware";

/**
 * Refreshes the Supabase session and, on protected paths, sends signed-out
 * visitors to /auth.
 *
 * Only middleware can write refreshed cookies, so this runs on session paths
 * and nowhere else: a public page must never come back with `Set-Cookie`, or a
 * CDN could cache one user's session for everyone.
 */
export async function updateSession(
	request: NextRequest,
	{ protectedPath }: { protectedPath: RegExp },
): Promise<NextResponse> {
	let response = NextResponse.next({ request });

	const supabase = createMiddlewareAuthClient(request, response);
	const me = await identityFromSupabaseAuth(supabase.auth);

	if (!me && protectedPath.test(request.nextUrl.pathname)) {
		const url = request.nextUrl.clone();
		url.pathname = "/auth";
		url.search = `?next=${encodeURIComponent(
			safeNext(request.nextUrl.pathname + request.nextUrl.search),
		)}`;
		const redirect = NextResponse.redirect(url);
		// Carry over whatever the refresh just wrote, or the next request starts
		// from the stale cookies again.
		for (const cookie of response.cookies.getAll()) {
			redirect.cookies.set(cookie);
		}
		response = redirect;
	}

	return response;
}

/**
 * Drops a duplicate session cookie. A sibling subdomain can set the same name
 * with a `Domain` attribute; the browser then sends both, and the wrong one may
 * win, which looks like a random sign-out.
 */
export function dropDuplicateSessionCookies(
	request: NextRequest,
	response: NextResponse,
): void {
	const base = sessionCookieName();
	const seen = new Map<string, number>();
	for (const cookie of request.cookies.getAll()) {
		if (cookie.name !== base && !cookie.name.startsWith(`${base}.`)) continue;
		seen.set(cookie.name, (seen.get(cookie.name) ?? 0) + 1);
	}
	for (const [name, count] of seen) {
		if (count > 1 && process.env.VERCEL_ENV === "production") {
			// Clear the domain-scoped copy; the host-only one is ours.
			response.cookies.set(name, "", {
				path: "/",
				maxAge: 0,
				domain: "quicktalog.app",
			});
		}
	}
}
