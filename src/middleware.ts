import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { isMaintenance, maintenanceBypass } from "@/lib/ops/flags";
import {
	dropDuplicateSessionCookies,
	expirePresentClerkCookies,
	updateSession,
} from "@/utils/supabase/session";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
	type NextFetchEvent,
	type NextRequest,
	NextResponse,
} from "next/server";

// Removed with Clerk in Phase 5.
const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);
const clerk = clerkMiddleware(
	async (auth, req) => {
		if (isProtectedRoute(req)) await auth.protect();
	},
	{
		// Send signed-out visitors to the app's own sign-in page, not Clerk's Account Portal.
		signInUrl: "/auth",
		signUpUrl: "/auth?mode=signup",
	},
);

/**
 * Paths where a session may be read or refreshed. Everything else is public and
 * must come back without `Set-Cookie`, so a CDN can cache it.
 */
const NEEDS_SESSION =
	/^\/(admin|auth)(\/|$)|^\/catalogues\/[^/]+\/preview$|^\/api\/(dashboard|agent|items\/uploadthing)(\/|$)/;

/** Paths a signed-out visitor is redirected away from. */
const PROTECTED = /^\/admin(\/|$)|^\/catalogues\/[^/]+\/preview$/;

/** Paths that change data, and are therefore refused during maintenance. */
const WRITE_PATHS =
	/^\/(admin|auth)(\/|$)|^\/api\/(dashboard|agent|items\/uploadthing)(\/|$)/;

export default async function middleware(
	request: NextRequest,
	event: NextFetchEvent,
) {
	const path = request.nextUrl.pathname;
	// A server action can hit any path, so it is identified by its header
	// rather than by the URL.
	const isAction = request.headers.has("next-action");

	if (
		(WRITE_PATHS.test(path) || isAction) &&
		(await isMaintenance()) &&
		!maintenanceBypass(request.cookies.get("qt-maint-bypass")?.value)
	) {
		return new NextResponse(
			"Quicktalog is upgrading sign-in. Back in a few minutes.",
			{ status: 503, headers: { "Retry-After": "900" } },
		);
	}

	if (AUTH_PROVIDER !== "supabase") {
		return clerk(request, event);
	}

	// Public pages: no auth call and no cookies written.
	if (!NEEDS_SESSION.test(path) && !isAction) {
		return NextResponse.next();
	}

	const response = await updateSession(request, { protectedPath: PROTECTED });
	// Every open tab still carrying a Clerk session loses it here, on its first
	// navigation to a session path after the cutover.
	expirePresentClerkCookies(request, response);
	dropDuplicateSessionCookies(request, response);
	return response;
}

export const config = {
	matcher: [
		// Pages and server actions. Skips Next internals, static files, the Sentry
		// tunnel, the PostHog proxy and server-to-server webhooks (no user session).
		"/((?!_next|monitoring|ingest|api/paddle|api/clerk|api/revalidate|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(trpc)(.*)",
	],
};
