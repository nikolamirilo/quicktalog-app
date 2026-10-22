import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

const sizes = {
	sm: "h-9 w-9 rounded-[11px] [&_svg]:size-[17px]",
	md: "h-[46px] w-[46px] rounded-[14px] [&_svg]:size-5",
	lg: "h-[52px] w-[52px] rounded-2xl [&_svg]:size-6",
};

/** Amber-tinted square holding an icon. */
export function IconTile({
	children,
	size = "md",
	className,
}: {
	children: ReactNode;
	size?: keyof typeof sizes;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"grid flex-none place-items-center border border-product-primary/35 bg-product-primary-soft text-product-primary-ink transition-colors",
				sizes[size],
				className,
			)}
		>
			{children}
		</span>
	);
}
