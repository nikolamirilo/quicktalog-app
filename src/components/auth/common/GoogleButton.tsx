"use client";

import { useState } from "react";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { LegalLinks } from "@/components/auth/common/LegalLinks";
import { GoogleLogo } from "@/components/general/GoogleLogo";
import { cn } from "@/lib/ui/cn";
import { createClient } from "@/utils/supabase/client";

/** Sends the browser to Google, then back through `/auth/callback`. */
export function GoogleButton({
	next,
	className,
	legalNotice = true,
}: {
	next: string;
	/** Spacing from the element above; the button itself sets none. */
	className?: string;
	/** Off where the screen already names the documents somewhere else. */
	legalNotice?: boolean;
}) {
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
		<div className={cn("space-y-3", className)}>
			<button
				aria-busy={busy || undefined}
				className={cn(
					"flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-product-border-strong bg-product-card text-[15px] font-semibold text-product-foreground transition-colors hover:border-product-muted hover:bg-product-background",
					busy && "cursor-progress opacity-70",
				)}
				disabled={busy}
				onClick={signInWithGoogle}
				type="button"
			>
				<GoogleLogo />
				{busy ? "Opening Google…" : "Continue with Google"}
			</button>
			{legalNotice ? (
				/* Clicking the button is the assent; Google's own screen is not ours. */
				<p className="text-center text-[12.5px] leading-[1.45] text-product-muted">
					By continuing you agree to our <LegalLinks />
				</p>
			) : null}
			<AuthNotice message={error} />
		</div>
	);
}
