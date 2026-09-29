import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/** macOS-style window buttons; decorative, so their colours are fixed. */
const windowDots = ["bg-[#ff5f57]", "bg-[#febc2e]", "bg-[#28c840]"];

/**
 * The top bar of a mock browser window: window dots, a URL pill and an
 * optional trailing control. Used around embedded demos and catalogues.
 */
export function BrowserChrome({
	url,
	icon,
	trailing,
	className,
	pillClassName,
	dotsClassName,
}: {
	url: ReactNode;
	icon?: ReactNode;
	trailing?: ReactNode;
	className?: string;
	pillClassName?: string;
	dotsClassName?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-none items-center gap-2.5 border-b border-product-border px-2.5 sm:px-3.5",
				className,
			)}
		>
			<span aria-hidden="true" className={cn("flex gap-1.5", dotsClassName)}>
				{windowDots.map((colour) => (
					<i
						className={cn("h-[11px] w-[11px] rounded-full", colour)}
						key={colour}
					/>
				))}
			</span>
			<div
				className={cn(
					"flex min-w-0 flex-1 items-center gap-[7px] rounded-full text-product-muted [&_svg]:flex-none",
					pillClassName,
				)}
			>
				{icon}
				{url}
			</div>
			{trailing}
		</div>
	);
}
