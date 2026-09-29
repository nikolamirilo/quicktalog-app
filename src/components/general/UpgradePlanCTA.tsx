import { Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/** Amber upgrade strip used inside the app (`.as-cta`). */
export const UpgradePlanCTA = ({
	type = "default",
	size = "default",
	title,
	subtitle,
	href,
	ctaLabel,
	className,
}: {
	/** `form` hides the button (the surrounding form has its own action). */
	type?: "default" | "form";
	size?: "default" | "small";
	title: string;
	subtitle: string;
	href?: string;
	ctaLabel?: string;
	className?: string;
}) => {
	const isSmall = size === "small";

	return (
		<div
			className={cn(
				"mb-[18px] flex flex-wrap items-center gap-x-4 gap-y-3 rounded-product-card border border-product-primary/50 bg-[linear-gradient(120deg,var(--product-primary-soft),var(--product-card)_80%)]",
				isSmall ? "px-3.5 py-3" : "px-[18px] py-4",
				className,
			)}
		>
			<span
				aria-hidden="true"
				className="grid h-10 w-10 flex-none place-items-center rounded-full bg-product-primary text-product-foreground"
			>
				<Star className="size-[19px]" />
			</span>
			<div className="min-w-0 flex-[1_1_220px]">
				<p
					className={cn(
						"font-product-heading font-bold leading-snug",
						isSmall ? "text-[14.5px]" : "text-[15.5px]",
					)}
				>
					{title}
				</p>
				<p
					className={cn(
						"mt-0.5 text-product-foreground-accent",
						isSmall ? "text-[13px]" : "text-sm",
					)}
				>
					{subtitle.trim()}
				</p>
			</div>
			{type === "default" && href && (
				<Button asChild size="sm">
					<Link href={href}>
						<Star aria-hidden="true" />
						{ctaLabel}
					</Link>
				</Button>
			)}
		</div>
	);
};
