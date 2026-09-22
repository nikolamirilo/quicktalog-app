"use client";

import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/common/AuthLayout";
import ClerkAuthForms from "@/components/auth/ClerkAuthForms";
import SupabaseAuthForms from "@/components/auth/SupabaseAuthForms";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * The `/auth` page, whichever provider is live.
 *
 * It no longer gates rendering on a `localStorage` read: the terms modal is
 * asked for by the sign-up *intent* (see `useSignupConsent`), so the sign-in
 * screen is present in the server HTML instead of appearing on hydration.
 */
export default function Auth({
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
