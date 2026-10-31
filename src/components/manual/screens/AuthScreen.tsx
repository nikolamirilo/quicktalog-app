import { Check, Eye } from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { AppNavbar } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/** Google's four-colour G. The kit holds no brand marks, so it is drawn here. */
function GoogleG() {
	return (
		<svg
			aria-hidden="true"
			className="h-[19px] w-[19px] flex-none"
			viewBox="0 0 48 48"
		>
			<title>Google</title>
			<path
				d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
				fill="#FFC107"
			/>
			<path
				d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
				fill="#FF3D00"
			/>
			<path
				d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
				fill="#4CAF50"
			/>
			<path
				d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
				fill="#1976D2"
			/>
		</svg>
	);
}

/** Cloudflare's cloud, in its own two oranges. */
function CloudflareCloud() {
	return (
		<svg aria-hidden="true" className="h-4 w-[26px]" viewBox="0 0 26 16">
			<title>Cloudflare</title>
			<circle cx="4.6" cy="11" fill="#FBAD41" r="3.6" />
			<circle cx="20.4" cy="10.4" fill="#FBAD41" r="4.2" />
			<circle cx="10.5" cy="7.6" fill="#F6821F" r="5.6" />
			<circle cx="16.4" cy="9.6" fill="#F6821F" r="4.2" />
			<rect fill="#F6821F" height="4.6" rx="2.3" width="18" x="4" y="10" />
		</svg>
	);
}

/**
 * The Cloudflare Turnstile captcha, drawn in its settled state. It is a
 * third-party widget rather than product chrome, so it keeps Cloudflare's own
 * near-white box and oranges instead of the product tokens.
 */
function TurnstileBox() {
	return (
		<div className="flex h-[65px] items-center justify-between rounded-[5px] border border-[#E0E0E0] bg-[#FAFAFA] px-3.5">
			<span className="flex items-center gap-2.5">
				<span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[#2E9E63] text-white">
					<Check className="h-[14px] w-[14px]" strokeWidth={3} />
				</span>
				<span className="text-[14px] leading-none text-[#3C3C3C]">
					Success!
				</span>
			</span>
			<span className="flex flex-col items-end gap-[3px]">
				<CloudflareCloud />
				<span className="text-[9px] leading-none text-[#8C8C8C]">
					Privacy &middot; Terms
				</span>
			</span>
		</div>
	);
}

/** One field of the form: a 14px label over a 48px input. */
function AuthField({
	below,
	label,
	placeholder,
	trailing,
}: {
	/** Anything under the input, such as the strength meter and its hint. */
	below?: ReactNode;
	label: string;
	placeholder: string;
	/** The show and hide eye, drawn inside the right end of the input. */
	trailing?: ReactNode;
}) {
	return (
		<div className="min-w-0">
			<p className="mb-[7px] text-[14px] font-semibold leading-[1.5] text-product-foreground">
				{label}
			</p>
			<span
				className={cn(
					"relative flex h-12 items-center rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card pl-4 text-[15px] text-product-muted",
					trailing ? "pr-[52px]" : "pr-4",
				)}
			>
				{placeholder}
				{trailing}
			</span>
			{below}
		</div>
	);
}

/**
 * The inline link style the product uses inside a sentence: ink text with a
 * thick amber underline. It names the three legal documents under the button,
 * and the Sign in link under the card.
 */
function InlineLink({ children }: { children: ReactNode }) {
	return (
		<span className="font-semibold text-product-foreground underline decoration-product-primary/85 decoration-2 underline-offset-[3px]">
			{children}
		</span>
	);
}

/** The Create account tab of the sign-in card at /auth. */
export function AuthScreen() {
	return (
		<Screen
			caption="The Create account tab of the Quicktalog sign-in card: a white 460px card with the Sign in and Create account switch, a Google button, and the Full name, Email and Password form with a captcha and an amber Create account button."
			height={1210}
			legend={[
				"The Sign in and Create account switch. The cell you are on is plain white with a soft shadow, never amber.",
				"Sign up with Google instead. The rule under it separates Google from the email form.",
				"Creating an account asks for a full name as well as an email. Signing in does not.",
				"The password field has an eye that shows what you typed, and four bars that stay grey until you start typing.",
				"The captcha has to pass before the amber Create account button will do anything.",
				"Pressing the button is how you accept the three documents. The line under the card goes back to signing in.",
			]}
			title="https://www.quicktalog.app/auth?mode=signup"
			width={1280}
		>
			<div className="absolute inset-0 overflow-hidden bg-product-background">
				<span
					aria-hidden="true"
					className="absolute inset-0 bg-[linear-gradient(to_right,rgba(22,20,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,20,15,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,#000_30%,transparent_100%)]"
				/>
				<span
					aria-hidden="true"
					className="absolute left-1/2 top-[568px] h-[720px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,176,32,0.24),rgba(255,176,32,0.08)_55%,transparent)]"
				/>

				<AppNavbar signedIn={false} />

				<div className="absolute left-1/2 top-[132px] flex w-[460px] -translate-x-1/2 flex-col items-center">
					<div className="w-full rounded-product-card border border-product-border bg-product-card px-10 pb-[42px] pt-10 shadow-[0_1px_2px_rgba(22,20,15,0.04),0_24px_60px_-28px_rgba(22,20,15,0.28),0_8px_24px_-12px_rgba(22,20,15,0.08)]">
						<div className="mb-[26px] grid grid-cols-2 gap-1 rounded-full border border-product-border bg-product-background-hero p-1">
							<span className="flex h-10 items-center justify-center rounded-full text-[14.5px] font-semibold text-product-foreground-accent">
								Sign in
							</span>
							<span className="relative flex h-10 items-center justify-center rounded-full bg-product-card text-[14.5px] font-bold text-product-foreground shadow-[0_1px_2px_rgba(22,20,15,0.08),0_4px_10px_-4px_rgba(22,20,15,0.12)]">
								<SpotMarker n={1} />
								Create account
							</span>
						</div>

						<p className="font-product-heading text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] text-product-foreground">
							Create your account
						</p>
						<p className="mt-2 text-[15.5px] leading-[1.55] text-product-foreground-accent">
							Build your first catalogue in minutes.
						</p>

						<div className="relative mt-6">
							<SpotMarker n={2} />
							<span className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-product-border-strong bg-product-card text-[15px] font-semibold text-product-foreground">
								<GoogleG />
								Continue with Google
							</span>
							<div className="my-5 flex items-center gap-3.5 text-[13px] font-semibold leading-[1.6] text-product-muted">
								<span className="h-px flex-1 bg-product-border" />
								or
								<span className="h-px flex-1 bg-product-border" />
							</div>
						</div>

						<div className="grid grid-cols-1 gap-[18px]">
							<div className="relative grid gap-[18px]">
								<SpotMarker className="-left-2 top-[22px]" n={3} />
								<AuthField label="Full name" placeholder="Jane Doe" />
								<AuthField label="Email" placeholder="name@company.com" />
							</div>

							<div className="relative">
								<SpotMarker className="-left-2 top-[22px]" n={4} />
								<AuthField
									below={
										<>
											<div className="mt-2.5 grid grid-cols-4 gap-1.5">
												{[1, 2, 3, 4].map((bar) => (
													<span
														className="h-[5px] rounded-full bg-product-border"
														key={bar}
													/>
												))}
											</div>
											<p className="mt-[7px] text-[13px] leading-[1.6] text-product-muted">
												Use at least 8 characters.
											</p>
										</>
									}
									label="Password"
									placeholder="At least 8 characters"
									trailing={
										<span className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-full text-product-muted">
											<Eye className="h-[19px] w-[19px]" />
										</span>
									}
								/>
							</div>

							<div>
								<div className="relative grid gap-[18px]">
									<SpotMarker n={5} />
									<TurnstileBox />
									<span className="flex h-[50px] w-full items-center justify-center rounded-full border-[1.5px] border-transparent bg-product-primary text-[16px] font-semibold text-product-foreground shadow-product-primary">
										Create account
									</span>
								</div>
								<p className="relative mt-4 text-center text-[13px] leading-[1.5] text-product-foreground-accent">
									<SpotMarker n={6} />
									By creating your account you agree to our{" "}
									<InlineLink>Terms &amp; Conditions</InlineLink>,{" "}
									<InlineLink>Privacy Policy</InlineLink> and{" "}
									<InlineLink>Refund Policy</InlineLink>.
								</p>
							</div>
						</div>
					</div>

					<p className="mt-5 text-center text-[15px] leading-[1.6] text-product-foreground-accent">
						Already have an account? <InlineLink>Sign in</InlineLink>
					</p>
				</div>
			</div>
		</Screen>
	);
}
