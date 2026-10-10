import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * Reading column for an article or doc body: the 720px measure, the base text
 * style, the rhythm between blocks, and the larger lead paragraph (the first
 * paragraph of the first prose run).
 */
export function ProseBody({
	children,
	id,
	className,
}: {
	children: ReactNode;
	id?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"min-w-0 max-w-[720px] text-[17px] leading-[1.75] text-product-foreground-accent [&>*+*]:mt-[18px]",
				"[&>div:first-of-type>p:first-child]:text-[clamp(18px,1.6vw,19.5px)] [&>div:first-of-type>p:first-child]:leading-[1.7] [&>div:first-of-type>p:first-child]:text-product-foreground",
				className,
			)}
			id={id}
		>
			{children}
		</div>
	);
}
