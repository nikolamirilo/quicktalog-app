"use client";

import { ArrowLeft, Inbox, KeyRound } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
	AuthCard,
	AuthEmphasis,
	AuthHeader,
} from "@/components/auth/common/AuthCard";
import { AuthDone } from "@/components/auth/common/AuthDone";
import { AuthField } from "@/components/auth/common/AuthField";
import { AuthFine } from "@/components/auth/common/AuthFine";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { AUTH_BACK } from "@/components/auth/common/authStyles";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { useTurnstile } from "@/components/auth/common/useTurnstile";
import { createClient } from "@/utils/supabase/client";
import { textLinkClass } from "@/components/general/TextLink";

const TIPS = [
	"The link can be used once and expires, so open it soon.",
	"Open it in this browser to keep things simple.",
	"Nothing after a few minutes? Check your spam folder.",
];

export function ResetPasswordForm({ onBack }: { onBack: () => void }) {
	const captcha = useTurnstile();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [sent, setSent] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);
	// "Try another email" brings the form back; focus then goes to its field.
	const refocusEmail = useRef(false);

	useEffect(() => {
		if (!sent && refocusEmail.current) {
			refocusEmail.current = false;
			emailRef.current?.focus();
		}
	}, [sent]);

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
			<AuthCard>
				<AuthDone
					icon={<Inbox />}
					subtitle={
						<>
							If <AuthEmphasis>{email.trim()}</AuthEmphasis> has an account, a
							reset link is on its way.
						</>
					}
					title="Check your inbox"
				>
					<ul className="mt-5 grid gap-2 rounded-2xl bg-product-background-hero px-4 py-3.5 text-left text-[14.5px] leading-normal text-product-foreground-accent">
						{TIPS.map((tip) => (
							<li
								className="relative pl-[22px] before:absolute before:left-[3px] before:top-[0.55em] before:size-2 before:rounded-full before:bg-product-primary"
								key={tip}
							>
								{tip}
							</li>
						))}
					</ul>
					<SubmitButton
						className="mt-[22px] h-12"
						onClick={onBack}
						type="button"
					>
						Back to sign in
					</SubmitButton>
					<AuthFine>
						Used the wrong address?{" "}
						<button
							className={textLinkClass}
							onClick={() => {
								refocusEmail.current = true;
								setEmail("");
								setSent(false);
							}}
							type="button"
						>
							Try another email
						</button>
					</AuthFine>
				</AuthDone>
			</AuthCard>
		);
	}

	return (
		<AuthCard>
			<AuthHeader
				badge={<KeyRound />}
				subtitle="We will email you a link to choose a new one."
				title="Reset your password"
			/>
			<form className="mt-6 grid gap-[18px]" onSubmit={submit}>
				<AuthNotice message={error} />
				<AuthField
					autoComplete="username"
					id="reset-email"
					inputMode="email"
					inputRef={emailRef}
					label="Email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="name@company.com"
					required
					type="email"
					value={email}
				/>
				{captcha.element}
				<SubmitButton
					busy={busy}
					busyLabel="Sending…"
					className="mt-1"
					disabled={captcha.pending}
					type="submit"
				>
					Send reset link
				</SubmitButton>
			</form>
			<button className={AUTH_BACK} onClick={onBack} type="button">
				<ArrowLeft aria-hidden="true" />
				Back to sign in
			</button>
		</AuthCard>
	);
}
