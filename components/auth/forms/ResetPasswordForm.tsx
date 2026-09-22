"use client";

import { type FormEvent, useState } from "react";
import AuthCard from "@/components/auth/common/AuthCard";
import AuthField from "@/components/auth/common/AuthField";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import AuthNotice from "@/components/auth/common/AuthNotice";
import AuthFooter from "@/components/auth/common/AuthFooter";
import { AUTH_LINK } from "@/components/auth/common/authStyles";
import SubmitButton from "@/components/auth/common/SubmitButton";
import useTurnstile from "@/components/auth/common/useTurnstile";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordForm({ onBack }: { onBack: () => void }) {
	const captcha = useTurnstile();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		setBusy(true);
		setError(null);

		const { error: resetError } =
			await createClient().auth.resetPasswordForEmail(email.trim(), {
				captchaToken: captcha.token ?? undefined,
				// Same rule as sign-up: origin only, the template builds the path.
				redirectTo: window.location.origin,
			});
		captcha.reset();
		setBusy(false);

		// Anything other than a rate limit or a failed captcha is reported as
		// success, so the form cannot be used to test whether an address exists.
		if (
			resetError &&
			(resetError.code === "captcha_failed" ||
				resetError.code === "over_request_rate_limit" ||
				resetError.code === "over_email_send_rate_limit")
		) {
			setError(authErrorMessage(resetError));
			return;
		}
		setSent(true);
	};

	if (sent) {
		return (
			<AuthCard
				subtitle={`If ${email.trim()} has an account, a reset link is on its way.`}
				title="Check your inbox"
			>
				<SubmitButton onClick={onBack} type="button" variant="outline">
					Back to sign in
				</SubmitButton>
			</AuthCard>
		);
	}

	return (
		<AuthCard
			subtitle="We will email you a link to choose a new one."
			title="Reset your password"
		>
			<form className="space-y-4" onSubmit={submit}>
				<AuthField
					autoComplete="username"
					id="reset-email"
					label="Email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="name@company.com"
					required
					type="email"
					value={email}
				/>
				{captcha.element}
				<AuthNotice message={error} />
				<SubmitButton
					busy={busy}
					busyLabel="Sending…"
					disabled={captcha.pending}
					type="submit"
				>
					Send reset link
				</SubmitButton>
			</form>
			<AuthFooter>
				<button className={AUTH_LINK} onClick={onBack} type="button">
					Back to sign in
				</button>
			</AuthFooter>
		</AuthCard>
	);
}
