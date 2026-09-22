"use client";

import { AUTH_CONTROL_HEIGHT } from "@/components/auth/common/authStyles";
import { cn } from "@/helpers/client";

export type AuthMode = "signin" | "signup";

/**
 * Swaps sign-in and sign-up in place, so creating an account is no longer a
 * page navigation to `?mode=signup`.
 *
 * Real `<button>`s rather than links: the mode is component state, and
 * `aria-pressed` is what tells a screen reader which one is showing.
 */
export default function AuthModeTabs({
	onChange,
	value,
}: {
	onChange: (mode: AuthMode) => void;
	value: AuthMode;
}) {
	const tab = (mode: AuthMode, label: string) => {
		const active = value === mode;
		return (
			<button
				aria-pressed={active}
				className={cn(
					AUTH_CONTROL_HEIGHT,
					"flex-1 rounded-lg text-sm font-medium transition-colors duration-200",
					active
						? "bg-product-background text-product-foreground shadow-sm"
						: "bg-transparent text-product-foreground-accent hover:text-product-foreground",
				)}
				onClick={() => onChange(mode)}
				type="button"
			>
				{label}
			</button>
		);
	};

	return (
		<div className="flex gap-1 rounded-xl bg-product-background-hero p-1">
			{tab("signin", "Sign in")}
			{tab("signup", "Create account")}
		</div>
	);
}
