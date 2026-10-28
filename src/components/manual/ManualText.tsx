import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** A run of body text inside a section. The article column sets the measure. */
export function ManualText({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"text-[17px] leading-[1.75] text-product-foreground-accent",
				"[&>*+*]:mt-3.5",
				"[&_a]:font-semibold [&_a]:text-product-primary-ink [&_a]:underline [&_a]:decoration-product-primary/50 [&_a]:underline-offset-2",
				"[&_strong]:font-semibold [&_strong]:text-product-foreground",
				"[&>h3]:mt-6 [&>h3]:font-product-heading [&>h3]:text-[17px] [&>h3]:font-bold [&>h3]:text-product-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
}
