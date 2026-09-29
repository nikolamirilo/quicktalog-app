"use client";

import { DollarSign, Lock, RotateCcw } from "lucide-react";

import { Container } from "@/components/general/Container";
import { Rise } from "@/components/general/Rise";
import { SectionHeading } from "@/components/general/SectionHeading";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { FeatureInfoDialog } from "@/components/pricing/FeatureInfoDialog";
import { MiniCTA } from "@/components/pricing/MiniCTA";
import { PricingColumn } from "@/components/pricing/PricingColumn";
import {
	customPlanFeatures,
	POPULAR_TIER_ID,
	paidTiers,
	priceIdFor,
	starterExtraFeatures,
	starterTier,
} from "@/constants/pricing";
import { usePricingPlans } from "@/hooks/usePricingPlans";
import { getYearlyNote } from "@/lib/format/price";

const topTier = paidTiers[paidTiers.length - 1];

const assurances = [
	{
		icon: RotateCcw,
		text: "10-day money-back guarantee on your first purchase",
	},
	{ icon: Lock, text: "Secure checkout by Paddle, our merchant of record" },
	{ icon: DollarSign, text: "Prices in USD. Local taxes may apply." },
];

/** Pricing page body: billing toggle, starter card, tier grid and comparison table. */
export function PricingPlans() {
	const {
		prices,
		pricesUnavailable,
		billingCycle,
		setBillingCycle,
		startCheckout,
		pendingPriceId,
		featureInfo,
	} = usePricingPlans();

	const starterPriceId = priceIdFor(starterTier, billingCycle);

	return (
		<>
			{/* The plan cards are h3s under this heading, like the comparison below. */}
			<section aria-labelledby="pricing-plans-heading">
				<Container className="pt-2">
					<h2 className="sr-only" id="pricing-plans-heading">
						Plans
					</h2>
					<BillingToggle
						className="mb-2.5"
						cycle={billingCycle}
						onChange={setBillingCycle}
					/>
					<p
						aria-live="polite"
						className="mb-9 text-center text-sm text-product-muted"
					>
						{billingCycle === "yearly"
							? "Showing yearly prices in USD, billed once a year."
							: "Showing monthly prices in USD. Switch to yearly to pay once a year."}
					</p>

					<PricingColumn
						billingCycle={billingCycle}
						ctaLabel="Start free"
						ctaVariant="default"
						extraFeatures={starterExtraFeatures}
						mode="starter"
						onInfo={featureInfo.showInfo}
						onSelect={() => startCheckout(starterTier, starterPriceId)}
						pending={pendingPriceId === starterPriceId}
						price={prices[starterPriceId]}
						priceUnavailable={pricesUnavailable}
						tier={starterTier}
					/>

					<div className="grid grid-cols-1 gap-[18px] pt-3.5 md:grid-cols-2 lg:grid-cols-4">
						{paidTiers.map((tier, index) => {
							const priceId = priceIdFor(tier, billingCycle);
							const highlight = tier.id === POPULAR_TIER_ID;
							return (
								<Rise className="h-full" delay={index * 70} key={tier.id}>
									<PricingColumn
										billingCycle={billingCycle}
										ctaLabel="Get started"
										ctaVariant={highlight ? "default" : "outline"}
										highlight={highlight}
										note={
											billingCycle === "yearly"
												? getYearlyNote(
														prices[tier.priceId.month],
														prices[tier.priceId.year],
													)
												: "Billed monthly"
										}
										onInfo={featureInfo.showInfo}
										onSelect={() => startCheckout(tier, priceId)}
										pending={pendingPriceId === priceId}
										price={prices[priceId]}
										priceUnavailable={pricesUnavailable}
										tier={tier}
									/>
								</Rise>
							);
						})}
					</div>

					<ul className="mx-auto mt-9 flex max-w-[1000px] flex-col items-center gap-x-7 gap-y-2.5 text-center text-sm text-product-foreground-accent sm:flex-row sm:flex-wrap sm:justify-center">
						{assurances.map(({ icon: Icon, text }) => (
							<li className="inline-flex items-center gap-2" key={text}>
								<Icon
									aria-hidden="true"
									className="h-[17px] w-[17px] text-product-primary-ink"
								/>
								{text}
							</li>
						))}
					</ul>
				</Container>
			</section>

			<section
				aria-labelledby="pricing-compare-heading"
				className="pb-10 pt-16 lg:pt-24"
			>
				<Container>
					<SectionHeading
						description="All limits apply per account. Page views are counted across all your catalogues each month."
						eyebrow="Compare plans"
						title={
							<span id="pricing-compare-heading">
								Every feature, side by side
							</span>
						}
					/>
					<ComparisonTable
						billingCycle={billingCycle}
						onSelect={startCheckout}
						pendingPriceId={pendingPriceId}
						prices={prices}
						pricesUnavailable={pricesUnavailable}
					/>
					<MiniCTA
						className="mt-10"
						ctaLabel="Talk to us"
						description="More catalogues, higher traffic or a feature built for your business. Tell us what you need and we will put together a custom plan."
						features={customPlanFeatures.pricing}
						href="/contact?subject=custom-plan"
						title={
							<>
								Need more than{" "}
								<span className="text-product-primary-ink">{topTier.name}</span>
								?
							</>
						}
					/>
				</Container>
			</section>
			<FeatureInfoDialog state={featureInfo} />
		</>
	);
}
