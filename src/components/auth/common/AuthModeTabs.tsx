"use client";

import { cn } from "@/lib/ui/cn";

export type AuthMode = "signin" | "signup";

/**
 * Swaps sign-in and sign-up in place, so creating an account is no longer a
 * page navigation to `?mode=signup`.
 *
 * Real `<button>`s rather than links: the mode is component state, and
 * `aria-pressed` is what tells a screen reader which one is showing.
 */
export function AuthModeTabs({
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
					"flex h-10 items-center justify-center rounded-full text-[14.5px] transition-[background-color,color,box-shadow] duration-200",
					active
						? "bg-product-card font-bold text-product-foreground shadow-[0_1px_2px_rgba(22,20,15,0.08),0_4px_10px_-4px_rgba(22,20,15,0.12)]"
						: "font-semibold text-product-foreground-accent hover:text-product-foreground",
				)}
				onClick={() => onChange(mode)}
				type="button"
			>
				{label}
			</button>
		);
	};

	return (
		<div
			aria-label="Account"
			className="grid grid-cols-2 gap-1 rounded-full border border-product-border bg-product-background-hero p-1"
			role="group"
		>
			{tab("signin", "Sign in")}
			{tab("signup", "Create account")}
		</div>
	);
}
