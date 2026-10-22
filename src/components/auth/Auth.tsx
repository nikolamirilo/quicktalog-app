"use client";

import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/common/AuthLayout";
import { ClerkAuthForms } from "@/components/auth/ClerkAuthForms";
import { SupabaseAuthForms } from "@/components/auth/SupabaseAuthForms";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * The `/auth` page, whichever provider is live.
 *
 * Acceptance of the legal documents is not asked for here: the email form has
 * its own checkbox, and everyone else - Google sign-ups, imported accounts -
 * meets the gate at `/auth/consent` on the way into `/admin`.
 */
export function Auth({
	termsVersion = null,
}: {
	/** Read on the server from `private.current_terms_version()`; only the Supabase forms use it. */
	termsVersion?: string | null;
}) {
	const mode = useSearchParams().get("mode");

	return (
		<AuthLayout>
			{AUTH_PROVIDER === "supabase" ? (
				<SupabaseAuthForms mode={mode} termsVersion={termsVersion} />
			) : (
				<ClerkAuthForms mode={mode} />
			)}
		</AuthLayout>
	);
}
