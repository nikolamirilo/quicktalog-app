"use client";

import { Button } from "@/components/ui/button";
import { defaultCatalogueData } from "@/constants/catalogue";
import {
	placeholderTemplate,
	standardTemplate,
} from "@/constants/catalogueTemplates";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { cn } from "@/helpers/client";
import { ContentBlock } from "@quicktalog/common";
import { Layout, Plus, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface TemplatesInputProps {
	onComplete?: () => void;
	direction?: "row" | "column";
}

const templates = [
	{
		id: "quick-start",
		title: "Quick Start",
		badge: "Recommended",
		description: "Everything you need to start selling right away",
		image: "/templates/quick-template.png",
		details: ["2 categories", "6 items"],
		icon: Zap,
		visual: "monitor-highlight",
		value: placeholderTemplate,
	},
	{
		id: "standard",
		title: "Standard Catalog",
		badge: null,
		description: "A flexible layout that works for everyone",
		image: "/templates/standard-template.png",
		details: ["15 items"],
		icon: Layout,
		visual: "monitor-standard",
		value: standardTemplate, // Per user instruction
	},
	{
		id: "scratch",
		title: "Start from Scratch",
		badge: null,
		description: "Build your catalog exactly the way you want it",
		details: [],
		icon: Plus,
		visual: "dash",
		value: defaultCatalogueData.content, // Per user instruction
	},
];

export default function TemplatesInput({
	onComplete,
	direction = "row",
}: TemplatesInputProps) {
	const { updateCatalogue } = useCatalogueContext();
	const [selectedId, setSelectedId] = useState<string>("quick-start");

	const handleSelect = () => {
		const selectedTemplate = templates.find((t) => t.id === selectedId);
		if (selectedTemplate) {
			updateCatalogue({
				content: selectedTemplate.value as unknown as ContentBlock[],
			});
			if (onComplete) {
				onComplete();
			}
		}
	};

	return (
		<div
			className={cn(
				"w-full mx-auto flex flex-col items-end gap-2 sm:gap-4 md:gap-6",
				direction === "row" ? "p-2 sm:p-4" : "p-1",
			)}
		>
			<div
				className={cn(
					"grid gap-2 w-full",
					direction === "column" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3",
				)}
			>
				{templates.map((template) => {
					const isSelected = selectedId === template.id;
					const isScratch = template.id === "scratch";

					return (
						<div
							key={template.id}
							onClick={() => setSelectedId(template.id)}
							className={cn(
								"group relative flex flex-col px-2 py-3 sm:py-4 md:py-6 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 h-full border-2",
								isSelected
									? "border-product-primary bg-product-primary/5 shadow-product-shadow ring-1 ring-product-primary"
									: "border-product-border bg-product-background hover:border-product-primary/50 hover:shadow-lg hover:scale-[1.01]",
								isScratch && !isSelected && "border-dashed border-gray-300",
							)}
						>
							{/* Header */}
							<div className="flex justify-between items-start mb-2 sm:mb-4 md:mb-6 z-10">
								<h3
									className={cn(
										"font-heading mx-auto mt-1 sm:mt-2 md:mt-4 font-bold text-sm sm:text-base text-product-foreground",
									)}
								>
									{isScratch ? "" : template.title}
								</h3>
								{template.badge && (
									<span className="bg-product-primary text-catalogue-button-text text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm absolute top-1 right-1">
										{template.badge}
									</span>
								)}
							</div>

							{/* Visual/Icon */}
							<div className="flex-grow flex items-center justify-center mb-2 sm:mb-4 md:mb-6 z-0">
								{isScratch ? (
									<div className="flex flex-col items-center gap-2 sm:gap-3 text-gray-400 group-hover:text-product-primary transition-colors">
										<Plus className="w-8 h-8 sm:w-10 sm:h-10" />
										<span className="font-heading font-bold text-base sm:text-lg text-gray-700 group-hover:text-product-foreground transition-colors">
											{template.title}
										</span>
									</div>
								) : (
									<Image
										src={template?.image}
										alt={template.title}
										width={80}
										height={80}
										className="w-20 h-20 sm:w-28 sm:h-28 md:w-[120px] md:h-[120px]"
									/>
								)}
							</div>

							{/* Description */}
							<div className="text-center space-y-1 sm:space-y-2 md:space-y-3 mt-auto">
								<p className="text-xs sm:text-sm text-product-foreground-accent font-medium leading-snug sm:leading-relaxed">
									{template.description}
								</p>
								{template.details.length > 0 && (
									<div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 font-semibold">
										{template.details.map((detail, index) => (
											<div key={index} className="flex items-center gap-1">
												{index > 0 && (
													<span className="w-1 h-1 rounded-full bg-gray-300 mr-1 sm:mr-2" />
												)}
												{detail}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<Button
				onClick={handleSelect}
				size="sm"
				className="font-bold text-xs sm:text-sm"
			>
				Select Template
			</Button>
		</div>
	);
}
