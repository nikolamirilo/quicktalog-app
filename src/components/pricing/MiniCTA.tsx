import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Rise } from "@/components/general/Rise";
import { PlanCheck } from "@/components/pricing/PlanCheck";
import { Button } from "@/components/ui/button";
import { customPlanFeatures } from "@/constants/pricing";
import { cn } from "@/lib/ui/cn";

type MiniCTAProps = {
	title?: ReactNode;
	description?: string;
	features?: string[];
	ctaLabel?: string;
	href?: string;
	className?: string;
};

/** Horizontal amber strip for custom-plan enquiries. */
export function MiniCTA({
	title = (
		<>
			Need something <span className="text-product-primary-ink">custom</span>?
			We've got you covered.
		</>
	),
	description,
	features = customPlanFeatures.home,
	ctaLabel = "Get Started",
	href = "/contact",
	className,
}: MiniCTAProps) {
	return (
		<Rise
			className={cn(
				"relative mt-7 flex flex-col items-start gap-[22px] overflow-hidden rounded-product-card border border-product-border bg-product-amber-strip p-[26px] shadow-product sm:flex-row sm:items-center sm:justify-between",
				className,
			)}
		>
			<div>
				<h3 className="text-[clamp(20px,2vw,25px)] font-bold tracking-[-0.02em]">
					{title}
				</h3>
				{description && (
					<p className="mt-2 max-w-[60ch] text-[15.5px] text-product-foreground-accent">
						{description}
					</p>
				)}
				<ul className="mt-3.5 flex flex-wrap gap-x-[22px] gap-y-2.5">
					{features.map((feature) => (
						<li
							className="flex items-start gap-2.5 text-[14.5px] leading-[1.5] text-product-foreground-accent"
							key={feature}
						>
							<PlanCheck />
							{feature}
						</li>
					))}
				</ul>
			</div>
			<Button asChild className="group w-full flex-none sm:w-auto">
				<Link href={href}>
					{ctaLabel}
					<ArrowRight
						aria-hidden="true"
						className="transition-transform group-hover:translate-x-[3px]"
					/>
				</Link>
			</Button>
		</Rise>
	);
}
