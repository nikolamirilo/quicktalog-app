import { type PricingPlan, tiers } from "@quicktalog/common";
import {
	CreditCard,
	ExternalLink,
	Settings,
	Shield,
	Star,
	Zap,
} from "lucide-react";
import Link from "next/link";

import { UpgradePlanCTA } from "@/components/general/UpgradePlanCTA";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format/price";

type PlanDetailsProps = {
	currentPlan: PricingPlan;
	currentPrice: string | undefined;
	loading: boolean;
	/** Paddle's customer portal: billing details, invoices, cancellation. */
	manageSubscriptionUrl: string;
};

const getPlanIcon = (planName: string) => {
	const name = planName?.toLowerCase();
	if (
		name?.includes("pro") ||
		name?.includes("premium") ||
		name?.includes("growth") ||
		name?.includes("custom")
	)
		return <Star />;
	if (name?.includes("enterprise")) return <Shield />;
	return <Zap />;
};

const highestStandardTierId = Math.max(
	...tiers.filter((tier) => tier.type === "standard").map((tier) => tier.id),
);

const canUpgrade = (pricingPlan: PricingPlan) =>
	pricingPlan.type === "standard" && pricingPlan.id < highestStandardTierId;

/**
 * The current plan card. Subscription start and renewal dates are not shown:
 * they live in `subscriptions`, which the app role cannot read.
 */
export function PlanDetails({
	currentPlan: pricingPlan,
	currentPrice,
	loading,
	manageSubscriptionUrl,
}: PlanDetailsProps) {
	if (!pricingPlan) {
		return (
			<div className="flex flex-col items-center gap-3 rounded-product-card border-[1.5px] border-dashed border-product-border-strong bg-product-card px-6 py-12 text-center">
				<CreditCard aria-hidden="true" className="size-12 text-product-muted" />
				<h2 className="text-xl font-bold">No Subscription Plan Found</h2>
				<p className="max-w-md text-product-foreground-accent">
					You haven't selected a Subscription plan yet. Choose a plan to get
					started.
				</p>
				<Button asChild>
					<Link href="/pricing">View Available Plans</Link>
				</Button>
			</div>
		);
	}

	const details = [
		{
			label: "Price",
			value: loading ? "…" : currentPrice ? formatPrice(currentPrice) : "–",
		},
		{
			label: "Subscription Cycle",
			value: pricingPlan.billing_period
				? `${pricingPlan.billing_period}ly`
				: "-",
		},
	];

	return (
		<>
			{canUpgrade(pricingPlan) && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle="Get more features, higher limits, and premium support."
					title="Upgrade your plan"
				/>
			)}

			<section
				aria-labelledby="plan-name-h"
				className="mb-[18px] flex flex-col gap-4 rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
			>
				<div className="flex flex-wrap items-start gap-x-3.5 gap-y-3">
					<span
						aria-hidden="true"
						className="grid h-12 w-12 flex-none place-items-center rounded-[15px] bg-product-primary text-product-foreground shadow-product-primary [&_svg]:size-[22px]"
					>
						{getPlanIcon(pricingPlan.name)}
					</span>
					<div className="min-w-0 flex-[1_1_200px]">
						<h2
							className="text-xl font-bold leading-tight tracking-[-0.02em]"
							id="plan-name-h"
						>
							{pricingPlan.name}
						</h2>
						<p className="text-sm text-product-foreground-accent">
							{pricingPlan.description}
						</p>
					</div>
					<Badge variant="success">Active</Badge>
				</div>

				<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-product-border bg-product-border">
					{details.map((detail) => (
						<div
							className="min-w-0 bg-product-card px-3.5 py-3"
							key={detail.label}
						>
							<dt className="text-[12.5px] font-semibold text-product-muted">
								{detail.label}
							</dt>
							<dd className="mt-0.5 font-product-heading text-[15px] font-bold capitalize leading-snug">
								{detail.value}
							</dd>
						</div>
					))}
				</dl>

				<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-product-border bg-product-background px-4 py-3.5">
					<div className="flex-[1_1_240px]">
						<p className="text-[15px] font-bold">Manage your subscription</p>
						<p className="text-sm text-product-foreground-accent">
							Update billing details, check transactions or cancel subscription.
						</p>
					</div>
					{pricingPlan.id === 0 ? (
						// The free plan has no Paddle subscription to manage.
						<Button disabled size="sm" variant="outline">
							<Settings aria-hidden="true" />
							Manage subscription
						</Button>
					) : (
						<Button asChild size="sm" variant="outline">
							<a
								href={manageSubscriptionUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<Settings aria-hidden="true" />
								Manage subscription
								<ExternalLink aria-hidden="true" />
								<span className="sr-only">(opens in a new tab)</span>
							</a>
						</Button>
					)}
				</div>
			</section>
		</>
	);
}
