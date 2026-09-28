import { type NextRequest, NextResponse } from "next/server";
import { identityFromSupabaseAuth } from "@/lib/auth/identity";
import { safeNext } from "@/lib/auth/redirects";
import { sessionCookieName } from "@/lib/auth/cookie-options";
import { createMiddlewareAuthClient } from "@/utils/supabase/middleware";

/** Clerk's cookies, cleared on the first session-path request after the cutover. */
const CLERK_COOKIES = [
	"__session",
	"__client_uat",
	"__refresh",
	"__clerk_db_jwt",
	"__clerk_handshake",
	"__clerk_handshake_nonce",
	"__clerk_redirect_count",
];

/** Query parameters Clerk adds to redirects; they mean nothing to us. */
const CLERK_PARAMS = [
	"__clerk_handshake",
	"__clerk_help",
	"__clerk_hs_reason",
	"__dev_session",
	"__clerk_synced",
];

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
 * Expires the Clerk cookies a browser still carries. Only the ones actually
 * present are touched, so a visitor who never used Clerk gets no `Set-Cookie`
 * at all.
 *
 * Clerk sets some cookies with a `Domain` on production, and a host-only
 * deletion would leave those behind, so both variants are expired there.
 */
export function expirePresentClerkCookies(
	request: NextRequest,
	response: NextResponse,
): void {
	const domain =
		process.env.VERCEL_ENV === "production" ? "quicktalog.app" : undefined;

	for (const cookie of request.cookies.getAll()) {
		const base = cookie.name.split("_").slice(0, 3).join("_");
		const isClerk = CLERK_COOKIES.some(
			(name) => cookie.name === name || cookie.name.startsWith(`${name}_`),
		);
		if (!isClerk && !CLERK_COOKIES.includes(base)) continue;

		response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
		if (domain) {
			response.cookies.set(cookie.name, "", { path: "/", maxAge: 0, domain });
		}
	}
}

/** Strips Clerk's handshake parameters from a URL, if any are present. */
export function stripClerkParams(url: URL): boolean {
	let changed = false;
	for (const param of CLERK_PARAMS) {
		if (url.searchParams.has(param)) {
			url.searchParams.delete(param);
			changed = true;
		}
	}
	return changed;
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
