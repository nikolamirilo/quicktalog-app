"use client";

import { SignIn, SignUp } from "@clerk/nextjs";

/**
 * Clerk's hosted sign-in and sign-up forms. Phase 2 adds the Supabase forms
 * beside this file; `Auth.tsx` picks between them, so the page around the form
 * (consent gate, layout) stays provider-agnostic.
 */
export default function ClerkAuthForms({ mode }: { mode: string | null }) {
	return mode === "signup" ? (
		<SignUp
			forceRedirectUrl="/admin/dashboard"
			routing="hash"
			signInUrl="/auth?mode=signin"
		/>
	) : (
		<SignIn
			forceRedirectUrl="/admin/dashboard"
			routing="hash"
			signUpUrl="/auth?mode=signup"
		/>
	);
}
