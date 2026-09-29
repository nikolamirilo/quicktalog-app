import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

const badgeVariants = cva(
	"inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-2.5 text-[11.5px] font-bold uppercase tracking-[0.04em] [&_svg]:size-3",
	{
		variants: {
			variant: {
				default: "bg-product-primary-soft text-product-primary-ink",
				primary: "bg-product-primary text-product-foreground",
				secondary: "bg-product-background-hero text-product-foreground-accent",
				success: "bg-product-success-soft text-product-success",
				info: "bg-product-info-soft text-product-info",
				destructive: "bg-product-error-soft text-product-error",
				outline:
					"border-product-border bg-product-card text-product-foreground-accent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
