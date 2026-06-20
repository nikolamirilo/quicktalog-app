import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { ComponentType } from "react";
import type { ReactNode } from "react";

type Variant = "tip" | "note" | "warning";

interface Props {
	title?: string;
	variant?: Variant;
	children: ReactNode;
}

const config: Record<
	Variant,
	{
		icon: ComponentType<{ className?: string }>;
		rail: string;
		bg: string;
		iconBg: string;
		iconText: string;
	}
> = {
	tip: {
		icon: Lightbulb,
		rail: "border-product-primary",
		bg: "bg-product-background-hover",
		iconBg: "bg-product-primary",
		iconText: "text-product-foreground",
	},
	note: {
		icon: Info,
		rail: "border-product-secondary",
		bg: "bg-product-background-hero",
		iconBg: "bg-product-secondary",
		iconText: "text-white",
	},
	warning: {
		icon: AlertTriangle,
		rail: "border-red-400",
		bg: "bg-red-50",
		iconBg: "bg-red-500",
		iconText: "text-white",
	},
};

/** Highlighted tip, note, or warning box used inside articles. */
export default function Callout({ title, variant = "tip", children }: Props) {
	const { icon: Icon, rail, bg, iconBg, iconText } = config[variant];

	return (
		<aside
			className={`my-8 flex gap-4 rounded-2xl border-l-4 ${rail} ${bg} p-5 ring-1 ring-product-border sm:p-6`}
		>
			<div
				className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconBg} ${iconText}`}
			>
				<Icon className="h-5 w-5" />
			</div>
			<div>
				{title && (
					<p className="mb-1 font-semibold text-product-foreground">{title}</p>
				)}
				<div className="leading-relaxed text-product-foreground-accent">
					{children}
				</div>
			</div>
		</aside>
	);
}
