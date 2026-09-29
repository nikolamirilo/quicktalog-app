import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/** Title and one-line description at the top of a settings group. */
export function PanelHeading({
	title,
	description,
	badge,
	className,
}: {
	title: string;
	description: string;
	badge?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mb-3", className)}>
			<h3 className="flex items-center gap-2 text-base font-extrabold leading-tight tracking-[-0.015em]">
				{title}
				{badge}
			</h3>
			<p className="mt-0.5 text-[13.5px] leading-snug text-product-muted">
				{description}
			</p>
		</div>
	);
}
