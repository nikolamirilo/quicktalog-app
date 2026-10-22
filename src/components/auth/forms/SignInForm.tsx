"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { AuthCard, AuthHeader } from "@/components/auth/common/AuthCard";
import { AuthDivider } from "@/components/auth/common/AuthDivider";
import { AuthField } from "@/components/auth/common/AuthField";
import { AuthFine } from "@/components/auth/common/AuthFine";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { AUTH_ACTION_LINK } from "@/components/auth/common/authStyles";
import { GoogleButton } from "@/components/auth/common/GoogleButton";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { useTurnstile } from "@/components/auth/common/useTurnstile";
import { createClient } from "@/utils/supabase/client";

export function SignInForm({
	next,
	onForgotPassword,
	tabs,
}: {
	next: string;
	onForgotPassword: () => void;
	tabs?: ReactNode;
}) {
	const router = useRouter();
	const captcha = useTurnstile();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		setBusy(true);
		setError(null);

		const { error: signInError } = await createClient().auth.signInWithPassword(
			{
				email: email.trim(),
				password,
				options: { captchaToken: captcha.token ?? undefined },
			},
		);
		captcha.reset();

		if (signInError) {
			setBusy(false);
			setError(authErrorMessage(signInError));
			return;
		}
		// The session cookie is written by the browser client; refresh so the
		// server components on the next page see it.
		router.replace(next);
		router.refresh();
	};

	return (
		<AuthCard tabs={tabs}>
			<AuthHeader
				subtitle="Sign in to your Quicktalog account."
				title="Welcome back"
			/>
			<GoogleButton className="mt-6" next={next} />
			<AuthDivider />
			<form className="grid grid-cols-1 gap-[18px]" onSubmit={submit}>
				<AuthNotice message={error} />
				<AuthField
					autoComplete="username"
					id="email"
					inputMode="email"
					label="Email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="name@company.com"
					required
					type="email"
					value={email}
				/>
				<AuthField
					action={
						<button
							className={AUTH_ACTION_LINK}
							onClick={onForgotPassword}
							type="button"
						>
							Forgot password?
						</button>
					}
					autoComplete="current-password"
					id="password"
					label="Password"
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••"
					required
					type="password"
					value={password}
				/>
				{captcha.element}
				<SubmitButton
					busy={busy}
					busyLabel="Signing in…"
					className="mt-1"
					disabled={captcha.pending}
					type="submit"
				>
					Sign in
				</SubmitButton>
			</form>
			{captcha.element ? (
				<AuthFine>
					<ShieldCheck aria-hidden="true" />
					Protected by Cloudflare Turnstile against bots.
				</AuthFine>
			) : null}
		</AuthCard>
	);
}
