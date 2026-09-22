"use client";
import { Card, CardContent } from "@/components/ui/card";
import { PricingPlan, Usage } from "@quicktalog/common";
import { BiGridAlt, BiScan } from "react-icons/bi";
import { FiBarChart2 } from "react-icons/fi";
import { IoAnalyticsOutline } from "react-icons/io5";
import { RiSparkling2Line } from "react-icons/ri";
import GaugeChart from "../charts/GaugeChart";

const MonthlyUsage = ({
	data,
	pricingPlan,
}: {
	data: Usage;
	pricingPlan: PricingPlan;
}) => {
	const trafficUsage = {
		used: data.traffic.pageview_count,
		limit: pricingPlan.features.traffic_limit,
		unit: "views",
		title: "Traffic",
		icon: <IoAnalyticsOutline className="w-5 h-5" />,
		shown: true,
	};

	const cataloguesUsage = {
		used: data.catalogues,
		limit: pricingPlan.features.catalogues,
		unit: "catalogues",
		title: "Catalogues",
		icon: <BiGridAlt className="w-5 h-5" />,
		shown: true,
	};

	const aiPromptsUsage = {
		used: data.prompts,
		limit: pricingPlan.features.ai_prompts,
		unit: "prompts",
		title: "AI Prompts",
		icon: <RiSparkling2Line className="w-5 h-5" />,
		shown: pricingPlan.features.ai_prompts > 0 ? true : false,
	};

	const ocrUsage = {
		used: data.ocr,
		limit: pricingPlan.features.ocr_ai_import,
		unit: "imports",
		title: "OCR Import",
		icon: <BiScan className="w-5 h-5" />,
		shown: pricingPlan.features.ocr_ai_import > 0 ? true : false,
	};

	const charts = [trafficUsage, cataloguesUsage, aiPromptsUsage, ocrUsage];

	return (
		<div className="max-w-6xl space-y-8 bg-gradient-to-br from-product-background to-product-background-hero  rounded-3xl">
			{/* Header Section */}
			<div className="space-y-4">
				<h2
					className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3"
					style={{
						fontFamily:
							"var(--font-playfair-display), var(--font-inter), serif",
					}}
				>
					<FiBarChart2 className="text-product-icon font-lora w-6 h-6 sm:w-8 sm:h-8" />{" "}
					Usage Overview
				</h2>
				<p className="text-product-foreground-accent text-lg max-w-2xl">
					Monitor your resource consumption and track usage across all features
				</p>
			</div>

			{/* Usage Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
				{charts
					.filter((item) => item.shown === true)
					.map((chart, index) => (
						<Card className="shadow-lg overflow-hidden" key={`usage-${index}`}>
							<CardContent className="p-6">
								{/* Header with Icon */}
								<div className="flex items-center gap-3 mb-6">
									<div className="w-10 h-10 rounded-full flex items-center justify-center bg-product-primary/10 text-product-primary">
										{chart.icon}
									</div>
									<h3 className="text-xl font-bold text-product-foreground">
										{chart.title}
									</h3>
								</div>

								<GaugeChart
									limit={chart.limit}
									unit={chart.unit}
									used={chart.used}
								/>
							</CardContent>
						</Card>
					))}
			</div>
		</div>
	);
};

export default MonthlyUsage;
