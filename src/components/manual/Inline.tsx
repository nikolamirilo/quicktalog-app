import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The product's own words, styled the way they look on screen so a reader can
 * match them to what is in front of them. Use the exact label, every time.
 */
export function ButtonName({
	children,
	variant = "primary",
}: {
	children: ReactNode;
	variant?: "primary" | "secondary";
}) {
	return (
		<span
			className={cn(
				"mx-[1px] inline-flex items-center rounded-[7px] px-[7px] py-[1px] text-[0.92em] font-bold leading-[1.5]",
				variant === "primary"
					? "bg-product-primary-soft text-product-primary-ink ring-1 ring-inset ring-product-primary/45"
					: "bg-product-background-hero text-product-foreground-accent ring-1 ring-inset ring-product-border-strong",
			)}
		>
			{children}
		</span>
	);
}

/** A field or setting name. */
export function FieldName({ children }: { children: ReactNode }) {
	return (
		<span className="font-semibold text-product-foreground">{children}</span>
	);
}

/** A menu item, list item or place in the product. */
export function PlaceName({ children }: { children: ReactNode }) {
	return (
		<span className="mx-[1px] inline-flex items-center rounded-[6px] bg-product-background-hero px-[6px] py-[1px] text-[0.92em] font-semibold leading-[1.5] text-product-foreground-accent">
			{children}
		</span>
	);
}

/** A tab. */
export function TabName({ children }: { children: ReactNode }) {
	return (
		<span className="mx-[1px] inline-flex items-center border-b-2 border-product-primary px-[3px] text-[0.95em] font-bold leading-[1.5] text-product-foreground">
			{children}
		</span>
	);
}

/** A key on the keyboard. */
export function KeyName({ children }: { children: ReactNode }) {
	return (
		<kbd className="mx-[1px] inline-flex min-w-[22px] items-center justify-center rounded-[6px] border border-product-border-strong border-b-2 bg-product-card px-[5px] py-[1px] font-product-body text-[0.84em] font-bold text-product-foreground-accent">
			{children}
		</kbd>
	);
}

/** A value the reader types, copies or sees in a URL. */
export function Value({ children }: { children: ReactNode }) {
	return (
		<code className="mx-[1px] rounded-[6px] bg-product-secondary-soft px-[6px] py-[1px] font-mono text-[0.86em] text-product-secondary">
			{children}
		</code>
	);
}

/** A message the product shows, quoted letter by letter. */
export function Message({ children }: { children: ReactNode }) {
	return (
		<q className="text-product-foreground [quotes:'\201C'_'\201D']">
			{children}
		</q>
	);
}

const tagStyles = {
	req: "bg-product-error-soft text-product-error-ink",
	def: "bg-product-info-soft text-product-info",
	lim: "bg-product-background-hero text-product-muted",
	opt: "bg-product-background-hero text-product-muted",
	plan: "bg-product-primary-soft text-product-primary-ink",
} as const;

/** A small fact about a setting: Required, a default, a limit or a plan. */
export function Tag({
	kind,
	children,
}: {
	kind: keyof typeof tagStyles;
	children: ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold leading-[1.5]",
				tagStyles[kind],
			)}
		>
			{children}
		</span>
	);
}
