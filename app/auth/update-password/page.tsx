import { notFound, redirect } from "next/navigation";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * Reached from a recovery link, after the confirm interstitial has turned the
 * token into a session. Without that session there is nothing to update, so the
 * page sends the visitor back to ask for a fresh link.
 */

// Reads the session cookie.
export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
	if (AUTH_PROVIDER !== "supabase") notFound();

	// The page never trusts a user id from the URL: identity comes from the session.
	if (!(await getVerifiedIdentity())) redirect("/auth?error=recovery");

	return (
		<>
			<Navbar />
			<div className="product font-lora min-h-screen">
				<div className="flex justify-center items-center mt-[5vh] min-h-screen px-4">
					<div className="w-full max-w-md bg-product-background rounded-3xl shadow-md p-8 border border-product-border">
						<UpdatePasswordForm />
					</div>
				</div>
			</div>
			<Footer />
		</>
	);
}
