import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { safeNext } from "@/lib/auth/redirects";
import { createForwardedAuthClient } from "@/utils/supabase/server-forwarded";

/**
 * Where an OAuth sign-in comes back to. It exchanges the PKCE code for a
 * session and sends the user on; it never reads a user id from the query.
 *
 * The exchange runs through the forwarded-IP client so GoTrue rate limits it
 * against the visitor's IP rather than the shared Vercel egress IP.
 */

// Reads the code verifier cookie, so it can never be prerendered or cached.
export const dynamic = "force-dynamic";

const CODE = /^[A-Za-z0-9._~-]{16,1024}$/;

export async function GET(req: NextRequest) {
	if (AUTH_PROVIDER !== "supabase") {
		return new NextResponse(null, { status: 404 });
	}

	const { origin, searchParams } = req.nextUrl;
	const fail = NextResponse.redirect(new URL("/auth?error=link", origin));

	// The provider reports a refusal (closed popup, denied consent) this way.
	if (searchParams.get("error")) {
		return NextResponse.redirect(new URL("/auth?error=oauth", origin));
	}

	const code = searchParams.get("code");
	if (!code || !CODE.test(code)) return fail;

	try {
		const auth = await createForwardedAuthClient();
		const { error } = await auth.exchangeCodeForSession(code);
		if (error) return fail;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "authCallback" } });
		return fail;
	}

	// `next` is attacker-controllable, so it only ever becomes a same-origin path.
	return NextResponse.redirect(
		new URL(safeNext(searchParams.get("next"), origin), origin),
	);
}
