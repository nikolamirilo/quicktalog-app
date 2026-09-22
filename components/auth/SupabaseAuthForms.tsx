"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LANDING_ERRORS } from "@/components/auth/common/authMessages";
import type { AuthMode } from "@/components/auth/common/AuthModeTabs";
import AuthModeTabs from "@/components/auth/common/AuthModeTabs";
import AuthNotice from "@/components/auth/common/AuthNotice";
import useSignupConsent from "@/components/auth/common/useSignupConsent";
import ResetPasswordForm from "@/components/auth/forms/ResetPasswordForm";
import SignInForm from "@/components/auth/forms/SignInForm";
import SignUpForm from "@/components/auth/forms/SignUpForm";
import { safeNext } from "@/lib/auth/redirects";

/**
 * The `/auth` screen on Supabase Auth. Every call underneath runs in the
 * browser through the publishable key, so GoTrue rate limits it per end-user IP
 * and Turnstile can gate it; the browser client can never reach a table.
 *
 * Sign-in and sign-up are one card with a mode switch rather than two pages:
 * `?mode=signup` still works, but only as the initial tab. Password reset takes
 * the whole card, because it is a different task rather than a third mode.
 */
type View = AuthMode | "reset";

export default function SupabaseAuthForms({
	mode,
	termsVersion,
}: {
	mode: string | null;
	termsVersion: string | null;
}) {
	const searchParams = useSearchParams();
	const [view, setView] = useState<View>("signin");
	const next = safeNext(searchParams.get("next"));
	// Set by the callback and confirm routes, which can only redirect here.
	const problem = LANDING_ERRORS[searchParams.get("error") ?? ""] ?? null;

	const showSignUp = useCallback(() => setView("signup"), []);
	const { modal, request: requestSignUp } = useSignupConsent(showSignUp);

	// A link into `?mode=signup` asks for the sign-up tab, and consent is asked
	// for the same way a click on the tab would ask.
	useEffect(() => {
		if (mode === "signup") requestSignUp();
	}, [mode, requestSignUp]);

	const tabs = (
		<AuthModeTabs
			onChange={(nextMode) =>
				nextMode === "signup" ? requestSignUp() : setView("signin")
			}
			value={view === "signup" ? "signup" : "signin"}
		/>
	);

	return (
		<div className="space-y-4">
			<AuthNotice message={problem} tone="info" />
			{view === "reset" ? (
				<ResetPasswordForm onBack={() => setView("signin")} />
			) : view === "signup" ? (
				<SignUpForm next={next} tabs={tabs} termsVersion={termsVersion} />
			) : (
				<SignInForm
					next={next}
					onForgotPassword={() => setView("reset")}
					tabs={tabs}
				/>
			)}
			{modal}
		</div>
	);
}
