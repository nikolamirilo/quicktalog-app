import { AlertTriangle, Info, Lightbulb, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type Variant = "tip" | "note" | "warning";

interface Props {
	title?: string;
	variant?: Variant;
	children: ReactNode;
}

const config: Record<
	Variant,
	{ icon: LucideIcon; label: string; box: string; tile: string }
> = {
	tip: {
		icon: Lightbulb,
		label: "Tip",
		box: "border-product-primary/45 bg-product-primary-soft",
		tile: "bg-product-primary text-product-foreground",
	},
	note: {
		icon: Info,
		label: "Note",
		box: "border-product-secondary/[0.14] bg-product-secondary-soft",
		tile: "border border-product-secondary/[0.18] bg-product-card text-product-secondary",
	},
	warning: {
		icon: AlertTriangle,
		label: "Warning",
		box: "border-product-error/25 bg-product-error-soft",
		tile: "border border-product-error/30 bg-product-card text-product-error",
	},
};

/** Highlighted tip, note, or warning box used inside articles and docs. */
export function Callout({ title, variant = "tip", children }: Props) {
	const { icon: Icon, label, box, tile } = config[variant];

	return (
		<aside
			className={cn(
				"flex items-start gap-3.5 rounded-[18px] border px-5 py-[18px]",
				box,
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"grid h-9 w-9 flex-none place-items-center rounded-xl",
					tile,
				)}
			>
				<Icon className="h-[18px] w-[18px]" />
			</span>
			<div className="min-w-0 text-[15.5px] leading-[1.65] text-product-foreground-accent [&_strong]:font-semibold [&_strong]:text-product-foreground">
				{title ? (
					<p className="mb-1 font-product-heading text-[16.5px] font-bold leading-[1.35] tracking-[-0.01em] text-product-foreground">
						<span className="sr-only">{label}: </span>
						{title}
					</p>
				) : (
					<span className="sr-only">{label}: </span>
				)}
				<div>{children}</div>
			</div>
		</aside>
	);
}
