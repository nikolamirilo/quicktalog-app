import type { Status } from "@quicktalog/common";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/ui/cn";

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
	active: {
		label: "Active",
		className: "bg-product-success-soft text-product-success",
	},
	draft: {
		label: "Draft",
		className:
			"border-product-primary/45 bg-product-primary-soft text-product-primary-ink",
	},
	inactive: {
		label: "Inactive",
		className:
			"border-product-border bg-product-background-hero text-product-muted",
	},
	in_preparation: {
		label: "In preparation",
		className: "bg-product-info-soft text-product-info",
	},
	error: {
		label: "Error",
		className: "bg-product-error-soft text-product-error",
	},
};

/** Catalogue status pill (`.as-badge .as-st-*`). */
export function StatusBadge({
	status,
	className,
}: {
	status: Status;
	className?: string;
}) {
	const style = STATUS_STYLE[status] ?? {
		label: status,
		className: STATUS_STYLE.inactive.className,
	};
	return (
		<Badge
			className={cn("self-start tracking-[0.06em]", style.className, className)}
		>
			{style.label}
		</Badge>
	);
}
