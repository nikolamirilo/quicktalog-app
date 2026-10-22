import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** A labelled contact-form control with a trailing icon, an error line and an optional footer. */
export function ContactField({
	id,
	label,
	required,
	icon,
	error,
	full,
	compact,
	children,
	footer,
}: {
	id: string;
	label: string;
	required?: boolean;
	icon: ReactNode;
	error?: string;
	/** Spans both columns from `sm`. */
	full?: boolean;
	/** 44px controls (dashboard) instead of 52px (contact page). */
	compact?: boolean;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className={cn("min-w-0", full && "sm:col-span-2")}>
			<label
				className="mb-[7px] block text-[14.5px] font-semibold text-product-foreground"
				htmlFor={id}
			>
				{label}{" "}
				{required && (
					<span aria-hidden="true" className="text-product-error">
						*
					</span>
				)}
			</label>
			<div className="relative">
				{children}
				<span
					aria-hidden="true"
					className={cn(
						"pointer-events-none absolute right-4 text-product-muted [&_svg]:h-[17px] [&_svg]:w-[17px]",
						compact ? "top-3.5" : "top-[18px]",
					)}
				>
					{icon}
				</span>
			</div>
			<div className="flex items-start justify-between gap-3">
				<p
					className="mt-1.5 text-[13.5px] font-medium text-product-error empty:hidden"
					id={`${id}-error`}
				>
					{error}
				</p>
				{footer}
			</div>
		</div>
	);
}
