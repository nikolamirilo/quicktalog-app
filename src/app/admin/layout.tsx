import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { needsConsentGate } from "@/lib/auth/consent";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * Holds `/admin` shut until the signed-in user has accepted the current legal
 * documents. Clerk hosts its own sign-up terms, so the gate is Supabase-only.
 *
 * A nudge rather than a boundary: a layout is not guaranteed to re-run on every
 * soft navigation, and the consequence of slipping past is someone browsing
 * without having accepted, not exposed data. The record on their row is the
 * authoritative artifact, and pages keep their own `requireUser`.
 *
 * No `next=`: a layout does not know its own pathname, and the screen is a
 * once-ever stop, so a deep link costs one redirect to the dashboard.
 */
export default async function AdminLayout({
	children,
}: {
	children: ReactNode;
}) {
	if (AUTH_PROVIDER === "supabase") {
		const me = await getVerifiedIdentity();
		// Signed out: middleware already redirects, and each page re-checks with
		// the `next` it can actually build. `unknown` lets them through rather
		// than gate on a reading we do not trust.
		if (me && (await needsConsentGate(me)).status === "needed") {
			redirect("/auth/consent");
		}
	}

	return <>{children}</>;
}
