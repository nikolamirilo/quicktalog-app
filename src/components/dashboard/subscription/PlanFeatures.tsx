import type { PricingPlan } from "@quicktalog/common";
import { ArrowRight, Check, Minus, Star } from "lucide-react";
import Link from "next/link";

import { AppSectionTitle } from "@/components/dashboard/common/AppHeadings";
import {
	formatPlanLimit,
	isFeatureIncluded,
	planFeatureGroups,
	planLimitRows,
} from "@/constants/pricing";
import { cn } from "@/lib/ui/cn";

/** The current plan: its limits as figures, then what's included by area. */
export function PlanFeatures({
	features,
}: {
	features: PricingPlan["features"];
}) {
	const groups = planFeatureGroups(features);
	const missingSome = groups.some((group) =>
		group.rows.some((row) => !isFeatureIncluded(row.value)),
	);

	return (
		<section
			aria-labelledby="plan-features-h"
			className="rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
		>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
				<AppSectionTitle icon={<Star />} id="plan-features-h">
					Plan Features
				</AppSectionTitle>
				{missingSome && (
					<Link
						className="inline-flex items-center gap-1 text-sm font-semibold text-product-primary-ink hover:underline"
						href="/pricing"
					>
						Compare plans
						<ArrowRight aria-hidden="true" className="size-4" />
					</Link>
				)}
			</div>

			<dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
				{planLimitRows(features).map(({ label, value }) => (
					<div
						className="min-w-0 rounded-[14px] bg-product-background-hero px-3.5 py-3"
						key={label}
					>
						<dt className="text-xs font-medium text-product-foreground-accent">
							{label}
						</dt>
						<dd className="mt-0.5 break-words font-product-heading text-lg font-extrabold tabular-nums text-product-foreground sm:text-xl">
							{formatPlanLimit(value)}
						</dd>
					</div>
				))}
			</dl>

			<div className="mt-5 grid gap-x-8 gap-y-5 xl:grid-cols-3">
				{groups.map((group) => (
					<div key={group.title}>
						<h3 className="mb-1.5 text-xs font-bold text-product-muted">
							{group.title}
						</h3>
						<ul className="divide-y divide-product-border">
							{group.rows.map(({ label, value }) => {
								const included = isFeatureIncluded(value);
								return (
									<li
										className="flex min-h-9 flex-wrap items-center gap-x-2.5 gap-y-0.5 py-1.5 text-sm"
										key={label}
									>
										{included ? (
											<span className="grid size-5 flex-none place-items-center rounded-full bg-product-primary text-product-foreground">
												<Check
													aria-hidden="true"
													className="size-3"
													strokeWidth={3.2}
												/>
											</span>
										) : (
											<span className="grid size-5 flex-none place-items-center rounded-full bg-product-background-hero text-product-muted">
												<Minus aria-hidden="true" className="size-3" />
											</span>
										)}
										<span
											className={cn(
												"min-w-0 flex-1",
												included
													? "font-medium text-product-foreground"
													: "text-product-muted",
											)}
										>
											{label}
										</span>
										{typeof value === "string" && included ? (
											<span className="ml-auto text-right text-xs font-semibold text-product-foreground-accent">
												{value}
											</span>
										) : (
											<span className="sr-only">
												{included ? "Included" : "Not included"}
											</span>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</section>
	);
}
