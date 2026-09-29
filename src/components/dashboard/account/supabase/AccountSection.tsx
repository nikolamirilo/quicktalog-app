import type { ReactNode } from "react";

import { AppCardTitle } from "@/components/dashboard/common/AppHeadings";
import { cn } from "@/lib/ui/cn";

/** One settings card: title, description, fields and an actions row. */
export function AccountSection({
	title,
	description,
	children,
	tone = "default",
	footer,
}: {
	title: string;
	description: string;
	children: ReactNode;
	tone?: "default" | "danger";
	/** Actions row, right-aligned (left-aligned for the danger zone). */
	footer?: ReactNode;
}) {
	const id = `account-${title.toLowerCase().replace(/\s+/g, "-")}-h`;
	return (
		<section
			aria-labelledby={id}
			className={cn(
				"rounded-product-card border bg-product-card p-5 shadow-product md:p-6",
				tone === "danger" ? "border-product-error/40" : "border-product-border",
			)}
		>
			<div className="mb-4 flex flex-col gap-1">
				<AppCardTitle
					className={cn(tone === "danger" && "text-product-error")}
					id={id}
				>
					{title}
				</AppCardTitle>
				<p className="text-sm text-product-foreground-accent">{description}</p>
			</div>
			<div className="flex flex-col gap-3">{children}</div>
			{footer && (
				<div
					className={cn(
						"mt-4 flex flex-wrap items-center gap-2.5",
						tone === "danger" ? "justify-start" : "justify-end",
					)}
				>
					{footer}
				</div>
			)}
		</section>
	);
}

/** Hint line under a field (`.as-hint`). */
export function AccountHint({ children }: { children: ReactNode }) {
	return (
		<p
			aria-live="polite"
			className="text-[12.5px] text-product-success"
			role="status"
		>
			{children}
		</p>
	);
}
