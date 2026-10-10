import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type HeadingProps = {
	icon?: ReactNode;
	children: ReactNode;
	className?: string;
	id?: string;
};

/** Page title of a dashboard tab (`.as-h1`). */
export function AppTitle({ icon, children, className, id }: HeadingProps) {
	return (
		<h1
			className={cn(
				"mb-[18px] flex items-center gap-3 text-title-app [&_svg]:size-7 [&_svg]:flex-none [&_svg]:text-product-primary-ink",
				className,
			)}
			id={id}
		>
			{icon}
			{children}
		</h1>
	);
}

/** Lead paragraph under an `AppTitle` (`.as-lead`). */
export function AppLead({ children }: { children: ReactNode }) {
	return (
		<p className="-mt-2.5 mb-[22px] max-w-[640px] text-[15.5px] text-product-foreground-accent">
			{children}
		</p>
	);
}

/** Section title inside a tab (`.as-h2`). */
export function AppSectionTitle({
	icon,
	children,
	className,
	id,
}: HeadingProps) {
	return (
		<h2
			className={cn(
				"flex items-center gap-2.5 text-xl font-bold leading-tight tracking-[-0.02em] [&_svg]:size-[22px] [&_svg]:flex-none [&_svg]:text-product-primary-ink",
				className,
			)}
			id={id}
		>
			{icon}
			{children}
		</h2>
	);
}

/** Card title: the prototype's `.as-h3` style, rendered as an `h2` (cards sit directly under the tab's `h1`). */
export function AppCardTitle({ children, className, id }: HeadingProps) {
	return (
		<h2
			className={cn(
				"text-[16.5px] font-bold leading-snug tracking-[-0.015em]",
				className,
			)}
			id={id}
		>
			{children}
		</h2>
	);
}
