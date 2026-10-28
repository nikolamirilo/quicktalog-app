import { AlertTriangle, Info, Lightbulb, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

const kinds = {
	info: {
		icon: Info,
		frame: "border-product-border bg-product-background-hero",
		mark: "text-product-muted",
		fallback: "Good to know",
	},
	tip: {
		icon: Lightbulb,
		frame: "border-product-primary/40 bg-product-primary-soft",
		mark: "text-product-primary-ink",
		fallback: "A quicker way",
	},
	warn: {
		icon: AlertTriangle,
		frame: "border-product-warning/40 bg-product-warning/10",
		mark: "text-product-warning",
		fallback: "Watch out",
	},
	risk: {
		icon: OctagonAlert,
		frame: "border-product-error/40 bg-product-error-soft",
		mark: "text-product-error-ink",
		fallback: "Cannot be undone",
	},
} as const;

/** A short aside. Keep it to two per section, and keep `risk` for real loss. */
export function Note({
	kind = "info",
	title,
	children,
}: {
	kind?: keyof typeof kinds;
	title?: string;
	children: ReactNode;
}) {
	const { icon: Icon, frame, mark, fallback } = kinds[kind];

	return (
		<div className={cn("mt-3.5 rounded-[16px] border p-3.5", frame)}>
			<p
				className={cn(
					"flex items-center gap-2 font-product-heading text-[14px] font-bold",
					mark,
				)}
			>
				<Icon aria-hidden="true" className="h-4 w-4 flex-none" />
				{title ?? fallback}
			</p>
			<div className="mt-1.5 text-[14.5px] text-product-foreground-accent [&>p+p]:mt-2">
				{children}
			</div>
		</div>
	);
}
