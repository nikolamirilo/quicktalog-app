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
				"inline-block text-sm font-bold text-product-primary-ink",
				className,
			)}
		>
			{children}
		</span>
	);
}
