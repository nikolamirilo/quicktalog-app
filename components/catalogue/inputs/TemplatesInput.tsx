"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const [selectedId, setSelectedId] = useState<string>("quick-start");
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [pendingTemplate, setPendingTemplate] = useState<any>(null);

	const executeSelect = (templateToUse: any) => {
		updateCatalogue({
			content: templateToUse.value as unknown as ContentBlock[],
		});
		if (onComplete) {
			onComplete();
		}
	};

	const handleSelect = () => {
		const selectedTemplate = templates.find((t) => t.id === selectedId);
		if (selectedTemplate) {
			if (catalogue?.content && catalogue.content.length > 0) {
				setPendingTemplate(selectedTemplate);
				setShowConfirmModal(true);
			} else {
				executeSelect(selectedTemplate);
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
								"group relative flex flex-col p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 h-full border-2",
								isSelected
									? "border-product-primary bg-product-primary/5 shadow-product-shadow ring-1 ring-product-primary"
									: "border-product-border bg-product-background hover:border-product-primary/50 hover:shadow-lg hover:scale-[1.01]",
								isScratch && !isSelected && "border-dashed border-gray-300",
							)}
						>
							{/* Header */}
							<div className="flex justify-between items-start mb-4 sm:mb-6 md:mb-8 z-10 w-full">
								<h3
									className={cn(
										"font-heading font-bold text-sm sm:text-base md:text-lg text-product-foreground w-full text-center",
									)}
								>
									{isScratch ? "" : template.title}
								</h3>
								{template.badge && (
									<span className="bg-product-primary text-catalogue-button-text text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm absolute top-2 right-2 sm:top-3 sm:right-3">
										{template.badge}
									</span>
								)}
							</div>

							{/* Visual/Icon */}
							<div className="flex-grow flex items-center justify-center mb-4 sm:mb-6 md:mb-8 z-0 w-full h-[120px] sm:h-[160px] md:h-[200px]">
								{isScratch ? (
									<div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-gray-400 group-hover:text-product-primary transition-colors h-full">
										<Plus className="w-10 h-10 sm:w-16 sm:h-16" />
										<span className="font-heading font-bold text-base sm:text-lg text-gray-700 group-hover:text-product-foreground transition-colors">
											{template.title}
										</span>
									</div>
								) : (
									<div className="relative w-full h-full flex items-center justify-center">
										<Image
											src={template?.image}
											alt={template.title}
											fill
											className="object-contain"
										/>
									</div>
								)}
							</div>

							{/* Description */}
							<div className="text-center space-y-2 sm:space-y-3 md:space-y-4 mt-auto">
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

			<AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Change Template?</AlertDialogTitle>
						<AlertDialogDescription>
							This will change your existing content. Please save it first to not lose progress.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (pendingTemplate) executeSelect(pendingTemplate);
							}}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
