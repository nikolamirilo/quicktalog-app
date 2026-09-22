"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { AuthError } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/auth/redirects";
import { createClient } from "@/utils/supabase/client";

/**
 * Supabase Auth sign-in, sign-up and password reset. Every call runs in the
 * browser through the publishable key, so GoTrue rate limits it per end-user IP
 * and Turnstile can gate it; the browser client can never reach a table.
 *
 * `Auth.tsx` picks between this and the Clerk forms, so the page around the
 * form (consent gate, layout) stays provider-agnostic.
 */

type View = "signin" | "reset";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const FIELD =
	"w-full px-4 py-3 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300";
const LABEL = "block text-sm font-semibold text-product-foreground mb-2";

/** What `/auth?error=...` means, in the words of the route that sent it here. */
const LANDING_ERRORS: Record<string, string> = {
	link: "That link is no longer valid. Links can be used once and expire; request a new one below.",
	oauth:
		"Google sign-in did not finish. Try again, or use your email and password.",
	recovery:
		"Open the reset link from your email again — this page needs the session it creates.",
};

/**
 * GoTrue's error codes, in the product's words. Anything unmapped falls back to
 * the API message, which is safe to show: it never names another account.
 */
function errorMessage(error: AuthError): string {
	switch (error.code) {
		case "invalid_credentials":
			return "That email and password do not match an account.";
		case "email_not_confirmed":
			return "Confirm your email address first — the link is in your inbox.";
		case "captcha_failed":
			return "The anti-bot check did not pass. Try again.";
		case "over_request_rate_limit":
		case "over_email_send_rate_limit":
			return "Too many attempts. Wait a few minutes and try again.";
		case "weak_password":
			return "That password is too weak. Use a longer one.";
		case "signup_disabled":
			return "New accounts are closed at the moment.";
		default:
			return error.message || "Something went wrong. Try again.";
	}
}

/** One captcha widget per form. The token is single-use, so it is reset after every submit. */
function useCaptcha() {
	const widget = useRef<TurnstileInstance | undefined>(undefined);
	const [token, setToken] = useState<string | null>(null);

	return {
		token,
		/** True when a widget is configured but has not produced a token yet. */
		pending: Boolean(SITE_KEY) && !token,
		reset: () => {
			setToken(null);
			widget.current?.reset();
		},
		element: SITE_KEY ? (
			<Turnstile
				className="flex justify-center"
				onError={() => setToken(null)}
				onExpire={() => setToken(null)}
				onSuccess={setToken}
				options={{ theme: "auto", size: "flexible" }}
				ref={widget}
				siteKey={SITE_KEY}
			/>
		) : null,
	};
}

function FormShell({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	/** Optional: the "check your inbox" state is a heading and nothing else. */
	children?: ReactNode;
}) {
	return (
		<div className="bg-product-background rounded-3xl shadow-md p-8 border border-product-border">
			<h1 className="text-2xl font-semibold text-product-foreground">
				{title}
			</h1>
			<p className="text-sm text-product-foreground-accent mt-1 mb-6">
				{subtitle}
			</p>
			{children}
		</div>
	);
}

function FormError({ message }: { message: string | null }) {
	if (!message) return null;
	return (
		<p className="text-sm text-red-500" role="alert">
			{message}
		</p>
	);
}

function GoogleButton({ next }: { next: string }) {
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const signInWithGoogle = async () => {
		setBusy(true);
		setError(null);
		// Not captcha-gated: GoTrue's /authorize takes no captcha token.
		const { error: oauthError } = await createClient().auth.signInWithOAuth({
			provider: "google",
			options: {
				// The one call that needs a path: Google sends the PKCE code back
				// here and only /auth/callback exchanges it for a session.
				redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
			},
		});
		if (oauthError) {
			setBusy(false);
			setError(errorMessage(oauthError));
		}
		// On success the browser is already navigating to Google.
	};

	return (
		<div className="space-y-2">
			<Button
				className="w-full"
				disabled={busy}
				onClick={signInWithGoogle}
				type="button"
				variant="outline"
			>
				<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
					<path
						d="M21.35 11.1H12v3.24h5.35c-.23 1.4-1.66 4.1-5.35 4.1a6.1 6.1 0 1 1 0-12.2 5.4 5.4 0 0 1 3.83 1.5l2.6-2.5A9.2 9.2 0 0 0 12 2.8a9.2 9.2 0 1 0 0 18.4c5.32 0 8.83-3.74 8.83-9 0-.6-.06-1.06-.16-1.5Z"
						fill="currentColor"
					/>
				</svg>
				Continue with Google
			</Button>
			<FormError message={error} />
		</div>
	);
}

function Divider() {
	return (
		<div className="flex items-center gap-3 my-6">
			<span className="h-px flex-1 bg-product-border" />
			<span className="text-xs uppercase tracking-wide text-product-foreground-accent">
				or
			</span>
			<span className="h-px flex-1 bg-product-border" />
		</div>
	);
}

function SignInForm({
	next,
	onForgotPassword,
}: {
	next: string;
	onForgotPassword: () => void;
}) {
	const router = useRouter();
	const captcha = useCaptcha();
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
			setError(errorMessage(signInError));
			return;
		}
		// The session cookie is written by the browser client; refresh so the
		// server components on the next page see it.
		router.replace(next);
		router.refresh();
	};

	return (
		<FormShell
			subtitle="Sign in to your Quicktalog account."
			title="Welcome back"
		>
			<GoogleButton next={next} />
			<Divider />
			<form className="space-y-4" onSubmit={submit}>
				<div>
					<label className={LABEL} htmlFor="email">
						Email
					</label>
					<input
						autoComplete="username"
						className={FIELD}
						id="email"
						onChange={(e) => setEmail(e.target.value)}
						placeholder="name@company.com"
						required
						type="email"
						value={email}
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="password">
						Password
					</label>
					<input
						autoComplete="current-password"
						className={FIELD}
						id="password"
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						required
						type="password"
						value={password}
					/>
				</div>
				{captcha.element}
				<FormError message={error} />
				<Button
					className="w-full"
					disabled={busy || captcha.pending}
					type="submit"
				>
					{busy ? "Signing in…" : "Sign in"}
				</Button>
			</form>
			<div className="mt-6 flex flex-col gap-2 text-sm text-product-foreground-accent">
				<button
					className="underline text-left w-fit"
					onClick={onForgotPassword}
					type="button"
				>
					Forgot your password?
				</button>
				<span>
					No account yet?{" "}
					<Link
						className="underline"
						href={`/auth?mode=signup&next=${encodeURIComponent(next)}`}
					>
						Create one
					</Link>
				</span>
			</div>
		</FormShell>
	);
}

function SignUpForm({
	next,
	termsVersion,
}: {
	next: string;
	termsVersion: string | null;
}) {
	const captcha = useCaptcha();
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
			setError(errorMessage(signUpError));
			return;
		}
		setSent(true);
	};

	if (sent) {
		return (
			<FormShell
				subtitle={`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`}
				title="Check your inbox"
			/>
		);
	}

	return (
		<FormShell
			subtitle="Build your first catalogue in minutes."
			title="Create your account"
		>
			<GoogleButton next={next} />
			<Divider />
			<form className="space-y-4" onSubmit={submit}>
				<div>
					<label className={LABEL} htmlFor="name">
						Full name
					</label>
					<input
						autoComplete="name"
						className={FIELD}
						id="name"
						maxLength={100}
						onChange={(e) => setFullName(e.target.value)}
						placeholder="Jane Doe"
						required
						type="text"
						value={fullName}
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="email">
						Email
					</label>
					<input
						autoComplete="username"
						className={FIELD}
						id="email"
						onChange={(e) => setEmail(e.target.value)}
						placeholder="name@company.com"
						required
						type="email"
						value={email}
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="password">
						Password
					</label>
					<input
						autoComplete="new-password"
						className={FIELD}
						id="password"
						minLength={8}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="At least 8 characters"
						required
						type="password"
						value={password}
					/>
				</div>
				<label
					className="flex items-start gap-3 text-sm text-product-foreground-accent"
					htmlFor="terms"
				>
					<input
						checked={acceptedTerms}
						className="mt-1 size-4 accent-product-primary"
						id="terms"
						onChange={(e) => setAcceptedTerms(e.target.checked)}
						required
						type="checkbox"
					/>
					<span>
						I agree to the{" "}
						<Link
							className="underline"
							href="/terms-of-service"
							target="_blank"
						>
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link className="underline" href="/privacy-policy" target="_blank">
							Privacy Policy
						</Link>
						{termsVersion ? ` (version ${termsVersion})` : ""}.
					</span>
				</label>
				{captcha.element}
				<FormError
					message={
						termsVersion
							? error
							: "Sign-up is briefly unavailable. Please try again in a minute."
					}
				/>
				<Button
					className="w-full"
					disabled={busy || captcha.pending || !acceptedTerms || !termsVersion}
					type="submit"
				>
					{busy ? "Creating your account…" : "Create account"}
				</Button>
			</form>
			<p className="mt-6 text-sm text-product-foreground-accent">
				Already have an account?{" "}
				<Link
					className="underline"
					href={`/auth?mode=signin&next=${encodeURIComponent(next)}`}
				>
					Sign in
				</Link>
			</p>
		</FormShell>
	);
}

function ResetForm({ onBack }: { onBack: () => void }) {
	const captcha = useCaptcha();
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
			setError(errorMessage(resetError));
			return;
		}
		setSent(true);
	};

	if (sent) {
		return (
			<FormShell
				subtitle={`If ${email.trim()} has an account, a reset link is on its way.`}
				title="Check your inbox"
			>
				<Button
					className="w-full"
					onClick={onBack}
					type="button"
					variant="outline"
				>
					Back to sign in
				</Button>
			</FormShell>
		);
	}

	return (
		<FormShell
			subtitle="We will email you a link to choose a new one."
			title="Reset your password"
		>
			<form className="space-y-4" onSubmit={submit}>
				<div>
					<label className={LABEL} htmlFor="reset-email">
						Email
					</label>
					<input
						autoComplete="username"
						className={FIELD}
						id="reset-email"
						onChange={(e) => setEmail(e.target.value)}
						placeholder="name@company.com"
						required
						type="email"
						value={email}
					/>
				</div>
				{captcha.element}
				<FormError message={error} />
				<Button
					className="w-full"
					disabled={busy || captcha.pending}
					type="submit"
				>
					{busy ? "Sending…" : "Send reset link"}
				</Button>
			</form>
			<button
				className="mt-6 text-sm text-product-foreground-accent underline"
				onClick={onBack}
				type="button"
			>
				Back to sign in
			</button>
		</FormShell>
	);
}

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

	return (
		<div className="space-y-4">
			{problem ? (
				<p
					className="rounded-xl border border-product-border bg-product-background px-4 py-3 text-sm text-product-foreground-accent"
					role="alert"
				>
					{problem}
				</p>
			) : null}
			{mode === "signup" ? (
				<SignUpForm next={next} termsVersion={termsVersion} />
			) : view === "reset" ? (
				<ResetForm onBack={() => setView("signin")} />
			) : (
				<SignInForm next={next} onForgotPassword={() => setView("reset")} />
			)}
		</div>
	);
}
