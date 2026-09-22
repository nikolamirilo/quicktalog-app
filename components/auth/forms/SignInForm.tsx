"use client";

import { useRouter } from "next/navigation";
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
import { cn } from "@/helpers/client";
import { createClient } from "@/utils/supabase/client";

export default function SignInForm({
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
		<AuthCard
			subtitle="Sign in to your Quicktalog account."
			tabs={tabs}
			title="Welcome back"
		>
			<GoogleButton next={next} />
			<AuthDivider />
			<form className="space-y-4" onSubmit={submit}>
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
					action={
						<button
							className={cn(AUTH_LINK, "text-xs")}
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
				<AuthNotice message={error} />
				<SubmitButton
					busy={busy}
					busyLabel="Signing in…"
					disabled={captcha.pending}
					type="submit"
				>
					Sign in
				</SubmitButton>
			</form>
		</AuthCard>
	);
}
