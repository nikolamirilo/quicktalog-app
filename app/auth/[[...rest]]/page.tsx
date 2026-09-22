import Auth from "@/components/auth/Auth";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { currentTermsVersion } from "@/lib/auth/terms";
import { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("authentication");

// The terms version comes from the database, so the rendered page must not be
// frozen at build time once Supabase sign-up is live.
export const revalidate = 300;

const page = async () => {
	// Clerk hosts its own sign-up terms, so the version is only read when the
	// Supabase forms are the ones being rendered.
	const termsVersion =
		AUTH_PROVIDER === "supabase" ? await currentTermsVersion() : null;

	return (
		<>
			<Navbar />
			<Auth termsVersion={termsVersion} />
			<Footer />
		</>
	);
};
export default page;
