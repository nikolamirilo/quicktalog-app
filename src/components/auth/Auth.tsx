"use client";

import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/common/AuthLayout";
import { SupabaseAuthForms } from "@/components/auth/SupabaseAuthForms";

/**
 * The `/auth` page.
 *
 * Acceptance of the legal documents is not asked for here: the email form has
 * its own checkbox, and everyone else - Google sign-ups, imported accounts -
 * meets the gate at `/auth/consent` on the way into `/admin`.
 */
export function Auth({
	termsVersion = null,
}: {
	/** Read on the server from `private.current_terms_version()`. */
	termsVersion?: string | null;
}) {
	const mode = useSearchParams().get("mode");

	return (
		<AuthLayout>
			<SupabaseAuthForms mode={mode} termsVersion={termsVersion} />
		</AuthLayout>
	);
}
