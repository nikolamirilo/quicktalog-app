"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import AuthNotice from "@/components/auth/common/AuthNotice";
import SubmitButton from "@/components/auth/common/SubmitButton";
import { createClient } from "@/utils/supabase/client";

/** Sends the browser to Google, then back through `/auth/callback`. */
export default function GoogleButton({ next }: { next: string }) {
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const signInWithGoogle = async () => {
		setBusy(true);
		setError(null);
		// Not captcha-gated: GoTrue's /authorize takes no captcha token.
		const { error: oauthError } = await createClient().auth.signInWithOAuth({
			provider: "google",
			options: {
				// The one call that needs a path: Google sends the PKCE code back
				// here and only /auth/callback exchanges it for a session.
				redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
			},
		});
		if (oauthError) {
			setBusy(false);
			setError(authErrorMessage(oauthError));
		}
		// On success the browser is already navigating to Google.
	};

	return (
		<div className="space-y-3">
			<SubmitButton
				busy={busy}
				onClick={signInWithGoogle}
				type="button"
				variant="outline"
			>
				<FcGoogle className="!size-5" />
				Continue with Google
			</SubmitButton>
			<AuthNotice message={error} />
		</div>
	);
}
