"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useState } from "react";
import AuthCard from "@/components/auth/common/AuthCard";
import AuthDivider from "@/components/auth/common/AuthDivider";
import AuthField from "@/components/auth/common/AuthField";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import AuthNotice from "@/components/auth/common/AuthNotice";
import { AUTH_LINK } from "@/components/auth/common/authStyles";
import GoogleButton from "@/components/auth/common/GoogleButton";
import SubmitButton from "@/components/auth/common/SubmitButton";
import useTurnstile from "@/components/auth/common/useTurnstile";
import { createClient } from "@/utils/supabase/client";

export default function SignUpForm({
	next,
	tabs,
	termsVersion,
}: {
	next: string;
	tabs?: ReactNode;
	termsVersion: string | null;
}) {
	const captcha = useTurnstile();
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!termsVersion) return;
		setBusy(true);
		setError(null);

		const { error: signUpError } = await createClient().auth.signUp({
			email: email.trim(),
			password,
			options: {
				captchaToken: captcha.token ?? undefined,
				// No path and no query: the email template appends its own
				// (`{{ .RedirectTo }}/auth/confirm?token_hash=...&type=...`), and
				// GoTrue only substitutes a redirect URL that is on the allow-list.
				emailRedirectTo: window.location.origin,
				// Read by the M10 sign-up trigger; the browser cannot write to any table.
				data: { full_name: fullName.trim(), terms_version: termsVersion },
			},
		});
		captcha.reset();
		setBusy(false);

		if (signUpError) {
			setError(authErrorMessage(signUpError));
			return;
		}
		setSent(true);
	};

	if (sent) {
		return (
			<AuthCard
				subtitle={`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`}
				title="Check your inbox"
			/>
		);
	}

	return (
		<AuthCard
			subtitle="Build your first catalogue in minutes."
			tabs={tabs}
			title="Create your account"
		>
			<GoogleButton next={next} />
			<AuthDivider />
			<form className="space-y-4" onSubmit={submit}>
				<AuthField
					autoComplete="name"
					id="name"
					label="Full name"
					maxLength={100}
					onChange={(e) => setFullName(e.target.value)}
					placeholder="Jane Doe"
					required
					type="text"
					value={fullName}
				/>
				<AuthField
					autoComplete="username"
					id="email"
					label="Email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="name@company.com"
					required
					type="email"
					value={email}
				/>
				<AuthField
					autoComplete="new-password"
					id="password"
					label="Password"
					minLength={8}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={password}
				/>
				<label
					className="flex items-start gap-2.5 text-sm leading-relaxed text-product-foreground-accent"
					htmlFor="terms"
				>
					<input
						checked={acceptedTerms}
						className="mt-0.5 size-4 shrink-0 accent-product-primary"
						id="terms"
						onChange={(e) => setAcceptedTerms(e.target.checked)}
						required
						type="checkbox"
					/>
					<span>
						I agree to the{" "}
						<Link
							className={AUTH_LINK}
							href="/terms-of-service"
							target="_blank"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link className={AUTH_LINK} href="/privacy-policy" target="_blank">
							Privacy Policy
						</Link>
						{termsVersion ? ` (version ${termsVersion})` : ""}.
					</span>
				</label>
				{captcha.element}
				<AuthNotice
					message={
						termsVersion
							? error
							: "Sign-up is briefly unavailable. Please try again in a minute."
					}
				/>
				<SubmitButton
					busy={busy}
					busyLabel="Creating your account…"
					disabled={captcha.pending || !acceptedTerms || !termsVersion}
					type="submit"
				>
					Create account
				</SubmitButton>
			</form>
		</AuthCard>
	);
}
