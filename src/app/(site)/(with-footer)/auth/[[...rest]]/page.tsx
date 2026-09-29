import { Metadata } from "next";
import { Suspense } from "react";
import { Auth } from "@/components/auth/Auth";
import { AuthSkeleton } from "@/components/auth/common/AuthSkeleton";
import { generatePageMetadata } from "@/constants/metadata";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { currentTermsVersion } from "@/lib/auth/terms";

export const metadata: Metadata = generatePageMetadata("authentication");

// The terms version comes from the database, so the rendered page must not be
// frozen at build time once Supabase sign-up is live.
export const revalidate = 300;

/**
 * Prerenders `/auth` itself. Without it the optional catch-all has no known
 * params and every visit (and every Log In / Start free prefetch) is rendered
 * by a function instead of being served from the CDN. The page reads no
 * cookies or headers; `?mode=` and `?next=` are read in the browser.
 */
export function generateStaticParams() {
	return [{ rest: [] }];
}

const page = async () => {
	// Clerk hosts its own sign-up terms, so the version is only read when the
	// Supabase forms are the ones being rendered.
	const termsVersion =
		AUTH_PROVIDER === "supabase" ? await currentTermsVersion() : null;

	// `Auth` reads the query string, which a static page only knows in the
	// browser; the boundary keeps that to the card instead of the whole page.
	return (
		<Suspense fallback={<AuthSkeleton />}>
			<Auth termsVersion={termsVersion} />
		</Suspense>
	);
};
export default page;
