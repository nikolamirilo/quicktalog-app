"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	AuthCard,
	AuthEmphasis,
	AuthHeader,
} from "@/components/auth/common/AuthCard";
import { AuthDivider } from "@/components/auth/common/AuthDivider";
import { AuthDone } from "@/components/auth/common/AuthDone";
import { AuthField } from "@/components/auth/common/AuthField";
import { AuthFine } from "@/components/auth/common/AuthFine";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { GoogleButton } from "@/components/auth/common/GoogleButton";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { useTurnstile } from "@/components/auth/common/useTurnstile";
import { createClient } from "@/utils/supabase/client";
import { textLinkClass } from "@/components/general/TextLink";

export function SignUpForm({
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
	const emailRef = useRef<HTMLInputElement>(null);
	// "Start again" brings the form back; focus then goes to the email field.
	const refocusEmail = useRef(false);

	useEffect(() => {
		if (!sent && refocusEmail.current) {
			refocusEmail.current = false;
			emailRef.current?.focus();
		}
	}, [sent]);

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

	/** "Wrong address?": back to the form with the address and password cleared. */
	const startAgain = () => {
		refocusEmail.current = true;
		setEmail("");
		setPassword("");
		setError(null);
		setSent(false);
	};

	if (sent) {
		return (
			<AuthCard tabs={tabs}>
				<AuthDone
					icon={<Inbox />}
					subtitle={
						<>
							We sent a confirmation link to{" "}
							<AuthEmphasis>{email.trim()}</AuthEmphasis>. Open it to finish
							creating your account.
						</>
					}
					title="Check your inbox"
				>
					<AuthFine>
						Wrong address?{" "}
						<button
							className={textLinkClass}
							onClick={startAgain}
							type="button"
						>
							Start again
						</button>
					</AuthFine>
				</AuthDone>
			</AuthCard>
		);
	}

	return (
		<AuthCard tabs={tabs}>
			<AuthHeader
				subtitle="Build your first catalogue in minutes."
				title="Create your account"
			/>
			<GoogleButton className="mt-6" next={next} />
			<AuthDivider />
			<form className="grid gap-[18px]" onSubmit={submit}>
				<AuthNotice
					message={
						termsVersion
							? error
							: "Sign-up is briefly unavailable. Please try again in a minute."
					}
				/>
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
					inputMode="email"
					inputRef={emailRef}
					label="Email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="name@company.com"
					required
					type="email"
					value={email}
				/>
				<AuthField
					autoComplete="new-password"
					hint="Use at least 8 characters."
					id="password"
					label="Password"
					meter
					minLength={8}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={password}
				/>
				<label
					className="flex items-start gap-2.5 text-[13.5px] leading-normal text-product-foreground-accent"
					htmlFor="terms"
				>
					<input
						checked={acceptedTerms}
						className="mt-0.5 size-[18px] shrink-0 accent-product-primary"
						id="terms"
						onChange={(e) => setAcceptedTerms(e.target.checked)}
						required
						type="checkbox"
					/>
					<span>
						I agree to the{" "}
						<Link
							className={textLinkClass}
							href="/terms-and-conditions"
							target="_blank"
						>
							Terms and Conditions
						</Link>{" "}
						and{" "}
						<Link
							className={textLinkClass}
							href="/privacy-policy"
							target="_blank"
						>
							Privacy Policy
						</Link>
						{termsVersion ? ` (version ${termsVersion})` : ""}.
					</span>
				</label>
				{captcha.element}
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
