import type { PricingPlan } from "@quicktalog/common";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
	formatLimit,
	type LimitContentData,
} from "@/components/modals/limits/limitContent";
import { TickList } from "@/components/modals/limits/TickList";

interface PlanComparisonProps {
	content: LimitContentData;
	currentPlan: PricingPlan;
	requiredPlan: PricingPlan;
	isStandardPlanLimitReached: boolean;
}

function PlanColumn({
	label,
	value,
	unit,
	planName,
	highlight = false,
}: {
	label: string;
	value: string;
	unit: string;
	planName: string;
	highlight?: boolean;
}) {
	return (
		<div className="flex min-w-0 flex-1 flex-col text-center">
			<span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-product-muted">
				{label}
			</span>
			<b
				className={
					highlight
						? "font-product-heading text-[28px] font-extrabold leading-tight text-product-primary-ink"
						: "font-product-heading text-[28px] font-extrabold leading-tight"
				}
			>
				{value}
			</b>
			<span className="text-[12.5px] text-product-foreground-accent">
				{unit} · {planName}
			</span>
		</div>
	);
}

export const LimitUpgradeComparison = ({
	content,
	currentPlan,
	requiredPlan,
	isStandardPlanLimitReached,
}: PlanComparisonProps) => {
	const singularLabel =
		content.feature === "AI Catalogue Generation"
			? "AI prompt"
			: content.feature === "OCR AI Import"
				? "OCR import"
				: content.feature.toLowerCase().replace(/s$/, "");

	const featureLabel = (count: number | "unlimited") =>
		count === 1 ? singularLabel : `${singularLabel}s`;

	const gains = [
		<span key="catalogues">
			<b>{formatLimit(requiredPlan.features.catalogues)}</b>{" "}
			{requiredPlan.features.catalogues > 1 ? "catalogues" : "catalogue"} with{" "}
			<b>{formatLimit(requiredPlan.features.sections_per_catalogue)}</b>{" "}
			sections and{" "}
			<b>{formatLimit(requiredPlan.features.items_per_catalogue)}</b> items per
			catalogue to manage all your product lines
		</span>,
		requiredPlan.features.ai_credits > 0 && (
			<span key="ai">
				<b>{formatLimit(requiredPlan.features.ai_credits)}</b> AI credits per
				month
			</span>
		),
		currentPlan.features.branding === false &&
			requiredPlan.features.branding === true && (
				<b key="branding">Custom Branding</b>
			),
		<span key="traffic">
			<b>{requiredPlan.features.traffic_limit.toLocaleString("en-US")}</b> page
			views per month to reach more customers
		</span>,
		requiredPlan.features.newsletter && (
			<span key="newsletter">
				<b>Newsletter feature</b> to keep customers engaged
			</span>
		),
	].filter(Boolean);

	const contactInstead = content.currentLimit === content.nextLimit;

	return (
		<>
			<div className="flex items-center gap-2.5 rounded-2xl border border-product-border bg-product-background p-3.5">
				<PlanColumn
					label="Current Plan"
					planName={currentPlan.name}
					unit={featureLabel(content.currentLimit)}
					value={formatLimit(content.currentLimit)}
				/>
				<ArrowRight
					aria-hidden="true"
					className="size-5 flex-none text-product-primary-ink"
				/>
				<PlanColumn
					highlight
					label="Required Plan"
					planName={
						isStandardPlanLimitReached ? "Custom Plan" : requiredPlan.name
					}
					unit={featureLabel(
						isStandardPlanLimitReached ? "unlimited" : content.nextLimit,
					)}
					value={
						isStandardPlanLimitReached ? "TBD" : formatLimit(content.nextLimit)
					}
				/>
			</div>

			<div className="rounded-2xl border border-product-primary/40 bg-product-primary-soft p-3.5">
				{isStandardPlanLimitReached ? (
					<>
						<p className="mb-1 text-sm font-bold">Purchase Custom Plan</p>
						<p className="text-sm text-product-foreground-accent">
							Get limits and features fully tailored to your needs. Contact our
							team to get more information.
						</p>
					</>
				) : (
					<>
						<p className="mb-2.5 text-sm font-bold">
							What You'll Get with {requiredPlan.name}
						</p>
						<TickList items={gains} />
					</>
				)}
			</div>

			<div className="mt-1 flex justify-end">
				<Button asChild className="group w-full min-[520px]:w-auto">
					<Link href={contactInstead ? "/contact" : "/pricing"}>
						{contactInstead
							? "Contact us Now"
							: `Upgrade to ${requiredPlan.name} Now`}
						<ArrowRight
							aria-hidden="true"
							className="transition-transform group-hover:translate-x-0.5"
						/>
					</Link>
				</Button>
			</div>
		</>
	);
};
