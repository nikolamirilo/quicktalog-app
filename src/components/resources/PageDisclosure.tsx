"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useRef } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The narrow-screen "On this page" / "Browse all docs" disclosure: a card with
 * a `<details>` summary row. It closes once a link inside it is followed, so
 * the page underneath is visible again.
 */
export function PageDisclosure({
	icon,
	label,
	meta,
	className,
	children,
}: {
	icon: ReactNode;
	label: string;
	/** Short text at the end of the summary row, such as "Part 2 of 8". */
	meta?: string;
	className?: string;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDetailsElement>(null);

	return (
		<details
			className={cn(
				"group rounded-[18px] border border-product-border bg-product-card shadow-[0_1px_2px_rgba(22,20,15,0.04)]",
				className,
			)}
			onClick={(event) => {
				if ((event.target as HTMLElement).closest("a") && ref.current) {
					ref.current.open = false;
				}
			}}
			ref={ref}
		>
			<summary className="flex min-h-[50px] cursor-pointer list-none items-center gap-2.5 rounded-[18px] px-4 text-[15px] font-bold text-product-foreground [&::-webkit-details-marker]:hidden">
				<span
					aria-hidden="true"
					className="grid place-items-center text-product-primary-ink [&_svg]:h-[17px] [&_svg]:w-[17px]"
				>
					{icon}
				</span>
				{label}
				{meta ? (
					<span className="ml-auto text-[12.5px] font-semibold text-product-muted">
						{meta}
					</span>
				) : null}
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"h-4 w-4 text-product-muted transition-transform group-open:rotate-180",
						!meta && "ml-auto",
					)}
				/>
			</summary>
			<div className="border-t border-product-border px-2 pb-2.5 pt-1">
				{children}
			</div>
		</details>
	);
}
