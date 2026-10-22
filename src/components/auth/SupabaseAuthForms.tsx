"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthSwitch } from "@/components/auth/common/AuthFine";
import { LANDING_ERRORS } from "@/components/auth/common/authMessages";
import type { AuthMode } from "@/components/auth/common/AuthModeTabs";
import { AuthModeTabs } from "@/components/auth/common/AuthModeTabs";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { ResetPasswordForm } from "@/components/auth/forms/ResetPasswordForm";
import { SignInForm } from "@/components/auth/forms/SignInForm";
import { SignUpForm } from "@/components/auth/forms/SignUpForm";
import { safeNext } from "@/lib/auth/redirects";
import { textLinkClass } from "@/components/general/TextLink";

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

export function SupabaseAuthForms({
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

	// A link into `?mode=signup` opens the sign-up tab. Acceptance of the legal
	// documents is the form's checkbox, or the gate at `/auth/consent`.
	useEffect(() => {
		if (mode === "signup") showSignUp();
	}, [mode, showSignUp]);

	const tabs = (
		<AuthModeTabs
			onChange={(nextMode) =>
				nextMode === "signup" ? showSignUp() : setView("signin")
			}
			value={view === "signup" ? "signup" : "signin"}
		/>
	);

	return (
		<>
			{problem ? (
				<div className="mb-4 w-full max-w-[460px]">
					<AuthNotice message={problem} tone="info" />
				</div>
			) : null}
			{view === "reset" ? (
				<ResetPasswordForm onBack={() => setView("signin")} />
			) : view === "signup" ? (
				<>
					<SignUpForm next={next} tabs={tabs} termsVersion={termsVersion} />
					<AuthSwitch>
						Already have an account?{" "}
						<button
							className={textLinkClass}
							onClick={() => setView("signin")}
							type="button"
						>
							Sign in
						</button>
					</AuthSwitch>
				</>
			) : (
				<>
					<SignInForm
						next={next}
						onForgotPassword={() => setView("reset")}
						tabs={tabs}
					/>
					<AuthSwitch>
						New to Quicktalog?{" "}
						<button
							className={textLinkClass}
							onClick={showSignUp}
							type="button"
						>
							Create a free account
						</button>
					</AuthSwitch>
				</>
			)}
		</>
	);
}
