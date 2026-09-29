import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** The pill look of a filter chip; also used by chip-style anchor links. */
export function filterChipClass(pressed: boolean) {
	return cn(
		"inline-flex min-h-10 flex-none items-center gap-2 whitespace-nowrap rounded-full border px-[15px] text-sm font-semibold leading-none transition-colors",
		pressed
			? "border-product-foreground bg-product-foreground text-white"
			: "border-product-border-strong bg-product-card text-product-foreground-accent hover:border-product-primary hover:text-product-foreground",
	);
}

/** Pill toggle used for category filters (articles, help). */
export function FilterChip({
	pressed,
	onClick,
	count,
	children,
}: {
	pressed: boolean;
	onClick: () => void;
	count?: number;
	children: ReactNode;
}) {
	return (
		<button
			aria-pressed={pressed}
			className={filterChipClass(pressed)}
			onClick={onClick}
			type="button"
		>
			{children}
			{count !== undefined && (
				<span
					className={cn(
						"inline-grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-xs",
						pressed
							? "bg-white/[0.16] text-white"
							: "bg-product-background-hero text-product-muted",
					)}
				>
					{count}
				</span>
			)}
		</button>
	);
}
