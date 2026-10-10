import { type LucideIcon, Sparkles, TrendingUp, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import type { ReleaseNoteTag } from "@/constants/releaseNotes";
import { cn } from "@/lib/ui/cn";

const styles: Record<ReleaseNoteTag, { icon: LucideIcon; className: string }> =
	{
		New: {
			icon: Sparkles,
			className:
				"border-product-primary/50 bg-product-primary-soft text-product-primary-ink",
		},
		Improved: {
			icon: TrendingUp,
			className:
				"border-product-secondary/[0.16] bg-product-secondary-soft text-product-secondary",
		},
		Fixed: {
			icon: Wrench,
			className:
				"border-product-border-strong bg-product-card text-product-foreground-accent",
		},
	};

/** New / Improved / Fixed pill. `children` overrides the label (e.g. "4 New"). */
export function ReleaseTagBadge({
	tag,
	children,
	className,
}: {
	tag: ReleaseNoteTag;
	children?: ReactNode;
	className?: string;
}) {
	const { icon: Icon, className: tone } = styles[tag];
	return (
		<span
			className={cn(
				"inline-flex h-[26px] flex-none items-center gap-[5px] whitespace-nowrap rounded-full border px-2.5 text-[12.5px] font-bold leading-none",
				tone,
				className,
			)}
		>
			<Icon aria-hidden="true" className="h-[13px] w-[13px]" />
			{children ?? tag}
		</span>
	);
}
