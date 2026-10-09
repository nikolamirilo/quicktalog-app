import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** Small amber pill for an article or doc category. */
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
				"inline-flex items-center self-start rounded-full bg-product-primary-soft px-[11px] py-[5px] text-xs font-bold leading-[1.2] text-product-primary-ink",
				className,
			)}
		>
			{children}
		</span>
	);
}
