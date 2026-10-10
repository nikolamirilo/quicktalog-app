"use client";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Usage } from "@quicktalog/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BiScan } from "react-icons/bi";
import { RiSparkling2Line } from "react-icons/ri";
import UpgradePlanCTA from "../../general/UpgradePlanCTA";
import CreateCatalogueButton from "../components/CreateCatalogueButton";

export interface QuickActionsProps {
	planId: number;
	matchedTier: any;
	usage: Usage;
}

export default function QuickActions({
	planId,
	matchedTier,
	usage,
}: QuickActionsProps) {
	const router = useRouter();

	const isAtCatalogueLimit =
		usage.catalogues >= matchedTier.features.catalogues;
	const isAtTrafficLimit =
		usage.traffic.pageview_count >= matchedTier.features.traffic_limit;
	const isAtAiLimit = usage.prompts >= matchedTier.features.ai_prompts;
	const isAtOcrLimit = usage.ocr >= matchedTier.features.ocr_ai_import;

	return (
		<>
			<div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
				<span className="w-9/12 sm:w-fit">
					<CreateCatalogueButton
						disabled={isAtCatalogueLimit || isAtTrafficLimit}
						showUpgradeTooltip={isAtCatalogueLimit || isAtTrafficLimit}
					/>
				</span>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="w-9/12 sm:w-fit">
								<Button
									className={`${planId < 1 && "animate-pulse"} w-full`}
									disabled={
										isAtAiLimit || isAtCatalogueLimit || isAtTrafficLimit
									}
									onClick={() => {
										router.push("/admin/create/ai");
									}}
									variant="outline"
								>
									<RiSparkling2Line
										className="sm:w-5 sm:h-5 md:w-6 md:h-6"
										size={18}
									/>{" "}
									Generate with AI
								</Button>
							</span>
						</TooltipTrigger>
						{(isAtAiLimit || isAtCatalogueLimit || isAtTrafficLimit) && (
							<TooltipContent className="max-w-[240px] border-none shadow-lg">
								<div className="flex flex-col gap-3">
									<p className="text-sm leading-relaxed">
										Upgrade to unlock AI generation and get higher limits.
									</p>
									<Link href="/pricing">
										<Button size="sm">View Pricing</Button>
									</Link>
								</div>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="w-9/12 sm:w-fit">
								<Button
									className="w-full"
									disabled={
										isAtOcrLimit || isAtCatalogueLimit || isAtTrafficLimit
									}
									onClick={() => {
										router.push("/admin/create/ocr");
									}}
									variant="outline"
								>
									<BiScan className="sm:w-5 sm:h-5 md:w-6 md:h-6" size={18} />
									Scan & Import Catalogue
								</Button>
							</span>
						</TooltipTrigger>
						{(isAtOcrLimit || isAtCatalogueLimit || isAtTrafficLimit) && (
							<TooltipContent className="max-w-[240px] border-none shadow-lg">
								<div className="flex flex-col gap-3">
									<p className="text-sm leading-relaxed">
										Upgrade to unlock OCR import and get higher limits.
									</p>
									<Link href="/pricing">
										<Button size="sm">View Pricing</Button>
									</Link>
								</div>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
			</div>
			{isAtCatalogueLimit && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle=" Upgrade your plan to get more catalogues, features, and higher limits."
					title="You've reached your current catalogue limit"
				/>
			)}
			{isAtTrafficLimit && (
				<UpgradePlanCTA
					ctaLabel="Upgrade plan"
					href="/pricing"
					subtitle="Upgrade your plan to increase your traffic limit and reactivate your catalogues."
					title="You've reached your traffic limit"
				/>
			)}
		</>
	);
}
