"use client";

import type { PricingPlan } from "@quicktalog/common";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";

import { PriceAmount } from "@/components/pricing/PriceAmount";
import { Button } from "@/components/ui/button";
import {
	type BillingCycle,
	type ComparisonValue,
	comparisonGroups,
	isFreeTier,
	POPULAR_TIER_ID,
	priceIdFor,
	standardTiers,
} from "@/constants/pricing";
import { cn } from "@/lib/ui/cn";

const stickyCell =
	"sticky left-0 z-[2] w-[150px] min-w-[150px] bg-product-card text-left shadow-[1px_0_0_var(--product-border)] md:w-[260px] md:min-w-[260px] md:pl-[22px]";
const cell = "border-b border-product-border px-3.5 py-[13px] align-middle";
const popularTier = standardTiers.find((tier) => tier.id === POPULAR_TIER_ID);
const popularCell = (tier: PricingPlan) =>
	tier.id === POPULAR_TIER_ID && "bg-product-primary-soft/50";

function Mark({ value }: { value: ComparisonValue }) {
	if (value === true) {
		return (
			<span className="inline-grid h-[22px] w-[22px] place-items-center rounded-full bg-product-primary text-product-foreground">
				<Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.2} />
				<span className="sr-only">Included</span>
			</span>
		);
	}
	if (value === false) {
		return (
			<>
				<span
					aria-hidden="true"
					className="text-lg font-bold text-product-border-strong"
				>
					–
				</span>
				<span className="sr-only">Not included</span>
			</>
		);
	}
	return <>{value}</>;
}

/** A group heading row; each group is its own <tbody>, so `rowgroup` scope applies. */
function GroupHeading({ children }: { children: ReactNode }) {
	return (
		<tr>
			<th
				className="bg-product-background-hero px-3.5 py-2.5 text-left text-[13px] font-bold tracking-[0.12em] text-product-primary-ink [font-variant-caps:all-small-caps] md:px-[22px]"
				colSpan={standardTiers.length + 1}
				scope="rowgroup"
			>
				<span className="sticky left-3.5 md:left-[22px]">{children}</span>
			</th>
		</tr>
	);
}

type ComparisonTableProps = {
	billingCycle: BillingCycle;
	prices: Record<string, string>;
	pricesUnavailable: boolean;
	pendingPriceId: string | null;
	onSelect: (tier: PricingPlan, priceId: string) => void;
};

/** Every plan side by side; scrolls sideways below `lg` with a sticky first column. */
export function ComparisonTable({
	billingCycle,
	prices,
	pricesUnavailable,
	pendingPriceId,
	onSelect,
}: ComparisonTableProps) {
	return (
		<>
			<section
				aria-label="Plan comparison table, scroll sideways on small screens"
				className="relative overflow-x-auto overscroll-x-contain rounded-product-card border border-product-border bg-product-card shadow-product"
				tabIndex={0}
			>
				<table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0 text-center text-[14.5px] leading-[1.35]">
					<caption className="sr-only">
						Feature comparison of{" "}
						{standardTiers.map((tier) => tier.name).join(", ")} plans.
						{popularTier && ` ${popularTier.name} is the most popular plan.`}
					</caption>
					<colgroup>
						<col className="w-[150px] md:w-[260px]" />
						{standardTiers.map((tier) => (
							<col key={tier.id} />
						))}
					</colgroup>
					<thead>
						<tr>
							<th
								className={cn(
									cell,
									stickyCell,
									"z-[3] border-product-border-strong pt-[30px] text-[13px] font-bold tracking-[0.12em] text-product-muted [font-variant-caps:all-small-caps]",
								)}
								scope="col"
							>
								Features
							</th>
							{standardTiers.map((tier) => (
								<th
									className={cn(
										cell,
										"relative border-product-border-strong bg-product-card pt-[30px] font-product-heading text-base font-extrabold tracking-[-0.01em]",
										tier.id === POPULAR_TIER_ID &&
											"bg-product-primary-soft shadow-[inset_0_3px_0_var(--product-primary)]",
									)}
									key={tier.id}
									scope="col"
								>
									{tier.id === POPULAR_TIER_ID && (
										// Decorative: the caption says which plan is most popular,
										// so the column header's name stays just the plan name.
										<span
											aria-hidden="true"
											className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap font-product-body text-[11px] font-bold tracking-[0.02em] text-product-primary-ink"
										>
											Most popular
										</span>
									)}
									{tier.name}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							<th className={cn(cell, stickyCell, "font-semibold")} scope="row">
								Price
							</th>
							{standardTiers.map((tier) => (
								<td
									className={cn(
										cell,
										"text-product-foreground-accent",
										popularCell(tier),
									)}
									key={tier.id}
								>
									<span className="font-product-heading text-[22px] font-extrabold tracking-[-0.03em] text-product-foreground">
										<PriceAmount
											price={prices[priceIdFor(tier, billingCycle)]}
											tier={tier}
											unavailable={pricesUnavailable}
										/>
									</span>
									<span className="mt-0.5 block text-[12.5px]">
										{billingCycle === "yearly" ? "/year" : "/month"}
									</span>
								</td>
							))}
						</tr>
					</tbody>
					{comparisonGroups.map((group) => (
						<tbody key={group.title}>
							<GroupHeading>{group.title}</GroupHeading>
							{group.rows.map((row) => (
								<tr key={row.label}>
									<th
										className={cn(cell, stickyCell, "font-semibold")}
										scope="row"
									>
										{row.label}
										{row.hint && (
											<small className="mt-[3px] block text-[12.5px] font-normal leading-[1.4] text-product-muted">
												{row.hint}
											</small>
										)}
									</th>
									{standardTiers.map((tier) => (
										<td
											className={cn(
												cell,
												"tabular-nums text-product-foreground-accent",
												popularCell(tier),
											)}
											key={tier.id}
										>
											<Mark value={row.value(tier)} />
										</td>
									))}
								</tr>
							))}
						</tbody>
					))}
					<tfoot>
						<tr>
							<th className={cn(stickyCell, "px-2.5 py-4")} scope="row">
								<span className="sr-only">Choose a plan</span>
							</th>
							{standardTiers.map((tier) => {
								const priceId = priceIdFor(tier, billingCycle);
								const pending = pendingPriceId === priceId;
								const label = isFreeTier(tier) ? "Start free" : "Get started";
								return (
									<td
										className={cn("px-2.5 py-4", popularCell(tier))}
										key={tier.id}
									>
										<Button
											aria-label={`${label} with ${tier.name}`}
											className="w-full px-2.5"
											disabled={pending}
											onClick={() => onSelect(tier, priceId)}
											size="sm"
											variant={
												tier.id === POPULAR_TIER_ID ? "default" : "outline"
											}
										>
											{pending ? "Starting..." : label}
										</Button>
									</td>
								);
							})}
						</tr>
					</tfoot>
				</table>
			</section>
			<p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-product-muted lg:hidden">
				<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
				Swipe the table to see every plan
			</p>
		</>
	);
}
