import { type ReactNode, useId } from "react";
import { cn } from "@/lib/ui/cn";
import { InfoTip } from "./InfoTip";

interface PanelSectionProps {
	title: string;
	/** Text for the (i) popover beside the title. */
	info?: ReactNode;
	/** One line under the title. */
	description?: ReactNode;
	/** Control at the end of the title row, e.g. the switch that enables the group. */
	action?: ReactNode;
	children?: ReactNode;
	className?: string;
	id?: string;
}

/** A titled group of fields in the editor panel: one white card per topic. */
export const PanelSection = ({
	title,
	info,
	description,
	action,
	children,
	className,
	id,
}: PanelSectionProps) => {
	const headingId = useId();
	return (
		<section
			aria-labelledby={headingId}
			className={cn(
				"space-y-4 rounded-product-card border border-product-border bg-product-card p-4 font-product-body",
				className,
			)}
			id={id}
		>
			<div className="flex min-h-7 items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-1">
						<h3
							className="font-product-heading text-[15px] font-bold leading-snug text-product-foreground"
							id={headingId}
						>
							{title}
						</h3>
						{info && <InfoTip label={title}>{info}</InfoTip>}
					</div>
					{description && (
						<p className="text-[13px] leading-snug text-product-muted">
							{description}
						</p>
					)}
				</div>
				{action && <div className="shrink-0 pt-0.5">{action}</div>}
			</div>
			{children}
		</section>
	);
};
