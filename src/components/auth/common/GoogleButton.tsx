"use client";

import { useState } from "react";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { cn } from "@/lib/ui/cn";
import { createClient } from "@/utils/supabase/client";

/** Google's four-colour "G". */
function GoogleLogo() {
	return (
		<svg
			aria-hidden="true"
			className="size-[19px] flex-none"
			viewBox="0 0 48 48"
		>
			<path
				d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
				fill="#FFC107"
			/>
			<path
				d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
				fill="#FF3D00"
			/>
			<path
				d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
				fill="#4CAF50"
			/>
			<path
				d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
				fill="#1976D2"
			/>
		</svg>
	);
}

/** Sends the browser to Google, then back through `/auth/callback`. */
export function GoogleButton({
	next,
	className,
}: {
	next: string;
	/** Spacing from the element above; the button itself sets none. */
	className?: string;
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
			<AuthNotice message={error} />
		</div>
	);
}
