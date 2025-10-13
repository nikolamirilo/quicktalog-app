"use client";
import { Card, CardContent } from "@/components/ui/card";
import { PricingPlan, Usage } from "@/types";
import { BiGridAlt, BiScan } from "react-icons/bi";
import { FiBarChart2 } from "react-icons/fi";
import { IoAnalyticsOutline } from "react-icons/io5";
import { RiSparkling2Line } from "react-icons/ri";
import DonutChart from "../../charts/DonutChart";

const MonthlyUsage = ({
	data,
	pricingPlan,
}: {
	data: Usage;
	pricingPlan: PricingPlan;
}) => {
	const trafficUsage = {
		data: [
			data.traffic.pageview_count,
			pricingPlan.features.traffic_limit - data.traffic.pageview_count,
		],
		labels: ["Used", "Remaining"],
		title: "Traffic",
		icon: <IoAnalyticsOutline className="w-6 h-6" />,
		shown: true,
		color: "text-product-primary",
	};

	const cataloguesUsage = {
		data: [data.catalogues, pricingPlan.features.catalogues - data.catalogues],
		labels: ["Used", "Remaining"],
		title: "Catalogues",
		icon: <BiGridAlt className="w-6 h-6" />,
		shown: true,
		color: "text-product-secondary",
	};

	const aiPromptsUsage = {
		data: [data.prompts, pricingPlan.features.ai_prompts - data.prompts],
		labels: ["Used", "Remaining"],
		title: "AI Prompts",
		icon: <RiSparkling2Line className="w-6 h-6" />,
		shown: pricingPlan.features.ai_prompts > 0 ? true : false,
		color: "text-product-primary-accent",
	};

	const ocrUsage = {
		data: [data.ocr, pricingPlan.features.ocr_ai_import - data.ocr],
		labels: ["Used", "Remaining"],
		title: "OCR Import",
		icon: <BiScan className="w-6 h-6" />,
		shown: pricingPlan.features.ocr_ai_import > 0 ? true : false,
		color: "text-product-icon",
	};

	const charts = [trafficUsage, cataloguesUsage, aiPromptsUsage, ocrUsage];

	return (
		<div className="max-w-6xl space-y-8 bg-gradient-to-br from-product-background to-hero-product-background  rounded-3xl">
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
						<Card
							key={index}
							className="bg-white border border-product-border shadow-lg overflow-hidden"
						>
							<CardContent className="p-6">
								{/* Header with Icon */}
								<div className="flex items-center gap-4 mb-6">
									<div className={chart.color}>{chart.icon}</div>
									<div>
										<h3 className="text-xl font-bold text-product-foreground">
											{chart.title}
										</h3>
									</div>
								</div>

								{/* Donut Chart */}
								<div className="flex justify-center mb-6">
									<div className="w-full max-w-48 h-32 sm:h-40 md:h-48">
										<DonutChart
											data={chart.data}
											labels={chart.labels}
											title={chart.title}
											description=""
											icon={chart.icon}
										/>
									</div>
								</div>

								{/* Usage Stats */}
								<div className="grid grid-cols-2 gap-4 pt-6 border-t border-product-border">
									<div className="text-center">
										<div className="text-2xl font-bold text-product-foreground">
											{chart.data[0].toLocaleString()}
										</div>
										<div className="text-sm text-product-foreground-accent">
											Used
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-product-foreground">
											{chart.data[1].toLocaleString()}
										</div>
										<div className="text-sm text-product-foreground-accent">
											Remaining
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
			</div>
		</div>
	);
};

export default MonthlyUsage;
