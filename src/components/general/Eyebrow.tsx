import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export function Eyebrow({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-block text-sm font-bold tracking-[0.14em] text-product-primary-ink [font-variant-caps:all-small-caps]",
				className,
			)}
		>
			{children}
		</span>
	);
}
