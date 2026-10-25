import { Metadata } from "next";
import { Suspense } from "react";
import { Auth } from "@/components/auth/Auth";
import { AuthSkeleton } from "@/components/auth/common/AuthSkeleton";
import { generatePageMetadata } from "@/constants/metadata";
import { currentTermsVersion } from "@/lib/auth/terms";

export const metadata: Metadata = generatePageMetadata("authentication");

// The terms version comes from the database, so the rendered page must not be
// frozen at build time. The page reads no cookies or headers; `?mode=` and
// `?next=` are read in the browser, so it is still served from the CDN.
export const revalidate = 300;

const page = async () => {
	const termsVersion = await currentTermsVersion();

	// `Auth` reads the query string, which a static page only knows in the
	// browser; the boundary keeps that to the card instead of the whole page.
	return (
		<Suspense fallback={<AuthSkeleton />}>
			<Auth termsVersion={termsVersion} />
		</Suspense>
	);
};
export default page;
