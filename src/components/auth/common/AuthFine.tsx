import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/** Small print under a form: the Turnstile note, "Didn't request this?". */
export function AuthFine({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				"mt-[18px] flex flex-wrap items-center justify-center gap-1.5 text-center text-[13px] leading-normal text-product-muted [&>svg]:size-3.5 [&>svg]:text-product-primary-ink",
				className,
			)}
		>
			{children}
		</p>
	);
}

/** The line under the card: "New to Quicktalog? Create a free account". */
export function AuthSwitch({ children }: { children: ReactNode }) {
	return (
		<p className="mt-5 max-w-[460px] text-center text-[15px] text-product-foreground-accent">
			{children}
		</p>
	);
}
