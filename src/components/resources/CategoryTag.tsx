import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** Small uppercase amber pill for an article or doc category. */
export function CategoryTag({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center self-start rounded-full bg-product-primary-soft px-[11px] py-[5px] text-xs font-bold uppercase leading-[1.2] tracking-[0.08em] text-product-primary-ink",
				className,
			)}
		>
			{children}
		</span>
	);
}
