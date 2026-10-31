import { isMaintenance, maintenanceBypass } from "@/lib/ops/flags";
import {
	dropDuplicateSessionCookies,
	updateSession,
} from "@/utils/supabase/session";
import { type NextRequest, NextResponse } from "next/server";

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

export default async function middleware(request: NextRequest) {
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
			"Quicktalog is down for maintenance. Back in a few minutes.",
			{ status: 503, headers: { "Retry-After": "900" } },
		);
	}

	// Public pages: no auth call and no cookies written.
	if (!NEEDS_SESSION.test(path) && !isAction) {
		return NextResponse.next();
	}

	const response = await updateSession(request, { protectedPath: PROTECTED });
	dropDuplicateSessionCookies(request, response);
	return response;
}

export const config = {
	matcher: [
		// Pages and server actions. Skips Next internals, static files, the Sentry
		// tunnel, the PostHog proxy and server-to-server webhooks (no user session).
		"/((?!_next|monitoring|ingest|api/paddle|api/revalidate|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(trpc)(.*)",
	],
};
