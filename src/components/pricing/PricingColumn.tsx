"use client";

import type { PricingPlan } from "@quicktalog/common";
import { ArrowRight, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { FeatureItem } from "@/components/pricing/FeatureItem";
import { PriceAmount } from "@/components/pricing/PriceAmount";
import { Button, type ButtonProps } from "@/components/ui/button";
import { type BillingCycle, getFeatureList } from "@/constants/pricing";
import type { ShowFeatureInfo } from "@/hooks/useFeatureInfo";
import { cn } from "@/lib/ui/cn";

type PricingColumnProps = {
	tier: PricingPlan;
	price: string | undefined;
	/** Paddle did not answer: stop showing a loading price. */
	priceUnavailable: boolean;
	billingCycle: BillingCycle;
	onSelect: () => void;
	pending: boolean;
	onInfo: ShowFeatureInfo;
	highlight?: boolean;
	/** `card`: tier grid. `row`: compact starter row (home). `starter`: wide free-plan card (pricing page). */
	mode?: "card" | "row" | "starter";
	ctaLabel?: string;
	ctaVariant?: ButtonProps["variant"];
	/** Line under the price, e.g. "Billed yearly · vs $144 paid monthly". */
	note?: string;
	/** Extra feature lines that are not plan limits (starter card only). */
	extraFeatures?: string[];
};

function PriceLine({
	tier,
	price,
	priceUnavailable,
	billingCycle,
	className,
	priceClassName,
	children,
}: Pick<
	PricingColumnProps,
	"tier" | "price" | "priceUnavailable" | "billingCycle"
> & {
	className?: string;
	priceClassName: string;
	children?: ReactNode;
}) {
	return (
		<div className={className}>
			<span
				className={cn(
					"font-product-heading font-extrabold tracking-[-0.03em] text-product-foreground",
					priceClassName,
				)}
			>
				<PriceAmount price={price} tier={tier} unavailable={priceUnavailable} />
			</span>
			<span className="ml-1.5 text-sm text-product-foreground-accent">
				{billingCycle === "yearly" ? "/year" : "/month"}
			</span>
			{children}
		</div>
	);
}

/** One plan: a grid card, the compact home starter row or the wide starter card. */
export function PricingColumn({
	tier,
	price,
	priceUnavailable,
	billingCycle,
	onSelect,
	pending,
	onInfo,
	highlight = false,
	mode = "card",
	ctaLabel = "Get Started",
	ctaVariant,
	note,
	extraFeatures = [],
}: PricingColumnProps) {
	const features = getFeatureList(tier.features);
	const variant = ctaVariant ?? (highlight ? "default" : "secondary");
	const priceProps = { tier, price, priceUnavailable, billingCycle };
	const featureItems = features.map((feature) => (
		<FeatureItem feature={feature} key={feature.type} onInfo={onInfo} />
	));
	const cta = (
		<Button
			className="group w-full"
			disabled={pending}
			onClick={onSelect}
			size={mode === "starter" ? "lg" : "default"}
			variant={variant}
		>
			{pending ? "Starting..." : ctaLabel}
			{mode !== "row" && !pending && (
				<ArrowRight
					aria-hidden="true"
					className="transition-transform group-hover:translate-x-[3px]"
				/>
			)}
		</Button>
	);

	if (mode === "row") {
		return (
			<article
				aria-label={`${tier.name} plan`}
				className="mb-8 flex flex-col gap-5 rounded-product-card border border-product-border bg-product-card p-6 shadow-product md:flex-row md:items-center md:gap-7"
			>
				<div className="flex-none md:w-64">
					<h3 className="mb-1.5 text-[19px] font-extrabold tracking-[-0.02em] text-product-primary-ink">
						{tier.name}
					</h3>
					<p className="mb-2.5 text-[14.5px] leading-[1.55] text-product-foreground-accent">
						{tier.description}
					</p>
					<PriceLine {...priceProps} priceClassName="text-[32px]" />
				</div>
				<ul className="grid flex-1 grid-cols-1 gap-x-7 gap-y-2.5 sm:grid-cols-2">
					{featureItems}
				</ul>
				<div className="flex-none md:w-[168px]">{cta}</div>
			</article>
		);
	}

	if (mode === "starter") {
		return (
			<article
				aria-label={`${tier.name} plan`}
				className="relative isolate mb-10 grid grid-cols-1 gap-[22px] overflow-hidden rounded-product-card border-[1.5px] border-product-primary/55 bg-[linear-gradient(120deg,#ffffff_0%,#fffbf1_55%,#fff1d2_100%)] px-[22px] py-[26px] shadow-[var(--product-shadow),0_0_0_6px_rgb(var(--product-primary-rgb)/0.08)] lg:grid-cols-[260px_minmax(0,1fr)_220px] lg:items-center lg:gap-9 lg:px-9 lg:py-8"
			>
				<div
					aria-hidden="true"
					className="absolute -right-[120px] -top-[160px] -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgb(var(--product-primary-rgb)/0.25),transparent)]"
				/>
				<div>
					<span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-product-primary px-3 py-[5px] text-[12.5px] font-bold text-product-foreground shadow-product-primary">
						<Zap aria-hidden="true" className="h-[13px] w-[13px]" />
						Free forever
					</span>
					<h3 className="mb-1.5 text-[26px] font-extrabold tracking-[-0.02em] text-product-primary-ink">
						{tier.name}
					</h3>
					<p className="text-[14.5px] leading-[1.55] text-product-foreground-accent">
						{tier.description}
					</p>
					<PriceLine
						{...priceProps}
						className="mt-3.5"
						priceClassName="text-[44px]"
					/>
				</div>
				<ul className="grid grid-cols-1 content-center gap-x-7 gap-y-3 sm:grid-cols-2">
					{featureItems}
					{extraFeatures.map((text) => (
						<FeatureItem feature={{ text }} key={text} />
					))}
				</ul>
				<div className="flex flex-col justify-center gap-2.5">{cta}</div>
			</article>
		);
	}

	return (
		<article
			aria-label={`${tier.name} plan`}
			className={cn(
				"relative mx-auto flex h-full w-full max-w-[384px] flex-col rounded-product-card border bg-product-card shadow-product transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover md:max-w-none",
				highlight
					? "border-product-primary/80 shadow-[0_0_0_1px_rgb(var(--product-primary-rgb)/0.45),0_24px_48px_-20px_rgb(var(--product-primary-accent-rgb)/0.45),var(--product-shadow)] hover:shadow-[0_0_0_1px_rgb(var(--product-primary-rgb)/0.45),0_24px_48px_-20px_rgb(var(--product-primary-accent-rgb)/0.45),var(--product-shadow-hover)]"
					: "border-product-border",
			)}
		>
			{highlight && (
				<span className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-product-primary px-3.5 py-[5px] text-[12.5px] font-bold text-product-foreground shadow-product-primary">
					Most popular
				</span>
			)}
			<div className="px-6 pb-2 pt-[26px]">
				<h3 className="mb-2.5 text-[22px] font-extrabold tracking-[-0.02em] text-product-primary-ink">
					{tier.name}
				</h3>
				<p className="min-h-[3.1em] text-[14.5px] leading-[1.55] text-product-foreground-accent">
					{tier.description}
				</p>
				<PriceLine
					{...priceProps}
					className="mb-[22px] mt-[18px]"
					priceClassName="text-[42px]"
				>
					{note && (
						<p className="mt-1.5 min-h-[1.3em] text-[13px] text-product-muted">
							{note}
						</p>
					)}
				</PriceLine>
				{cta}
			</div>
			<div className="flex-1 px-6 pb-7 pt-[18px]">
				<p className="mb-3 text-[15px] font-bold tracking-[0.14em] text-product-foreground [font-variant-caps:all-small-caps]">
					Features
				</p>
				<ul className="flex flex-col gap-3">{featureItems}</ul>
			</div>
		</article>
	);
}
