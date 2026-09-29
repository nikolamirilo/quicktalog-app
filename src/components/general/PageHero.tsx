import type { ReactNode } from "react";

import { Container } from "@/components/general/Container";
import { Eyebrow } from "@/components/general/Eyebrow";
import { cn } from "@/lib/ui/cn";

type PageHeroProps = {
	title: ReactNode;
	/** Small pill above the title. */
	kicker?: ReactNode;
	/** Small-caps label above the title, for pages without a pill kicker. */
	eyebrow?: ReactNode;
	lead?: ReactNode;
	children?: ReactNode;
	align?: "center" | "left";
	/** Less space below, for pages whose content starts right away. */
	short?: boolean;
	className?: string;
};

/** Top-of-page hero: faint grid, amber glow, and a fade into the page background. */
export function PageHero({
	title,
	kicker,
	eyebrow,
	lead,
	children,
	align = "center",
	short = false,
	className,
}: PageHeroProps) {
	return (
		<section
			className={cn(
				"relative isolate overflow-hidden pb-9 pt-[120px] lg:pt-[150px]",
				short ? "lg:pb-8" : "lg:pb-12",
				className,
			)}
		>
			<HeroBackdrop />
			<Container className={cn(align === "center" && "text-center")}>
				<div className={cn(align === "center" && "mx-auto max-w-[860px]")}>
					{kicker && <HeroKicker>{kicker}</HeroKicker>}
					{eyebrow && <Eyebrow className="mb-3 block">{eyebrow}</Eyebrow>}
					<h1 className="text-balance text-display-lg">{title}</h1>
					{lead && (
						<p
							className={cn(
								"mt-[18px] max-w-[640px] text-lead text-product-foreground-accent",
								align === "center" && "mx-auto",
							)}
						>
							{lead}
						</p>
					)}
				</div>
				{children}
			</Container>
		</section>
	);
}

/** Decorative layers shared by every hero. Parent must be `relative isolate`. */
export function HeroBackdrop() {
	return (
		<>
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(var(--product-foreground-rgb)/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--product-foreground-rgb)/0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_40%,#000_45%,transparent_100%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -right-[10%] top-[10%] -z-10 h-[480px] w-[480px] rounded-full bg-product-primary/[0.18] blur-[110px]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140px] bg-gradient-to-b from-transparent to-product-background"
			/>
		</>
	);
}

export function HeroKicker({
	children,
	icon,
}: {
	children: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<span className="mb-[22px] inline-flex items-center gap-2 rounded-full border border-product-border bg-product-card py-1.5 pl-2 pr-3.5 text-[13.5px] font-semibold text-product-foreground-accent shadow-[0_1px_2px_rgba(22,20,15,0.05)]">
			<span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-product-primary text-product-foreground [&_svg]:size-3">
				{icon}
			</span>
			{children}
		</span>
	);
}
