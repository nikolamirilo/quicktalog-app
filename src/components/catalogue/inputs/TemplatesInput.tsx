"use client";

import { updateCatalogue as updateCatalogueAction } from "@/actions/catalogue";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	placeholderTemplate,
	standardTemplate,
} from "@/constants/catalogueTemplates";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { cn } from "@/lib/ui/cn";
import { ContentBlock, defaultCatalogueData } from "@quicktalog/common";
import { Layout, Plus, Zap } from "lucide-react";
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
		image: "/images/templates/quick-template.png",
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
		image: "/images/templates/standard-template.png",
		details: ["4 categories", "15 items"],
		icon: Layout,
		visual: "monitor-standard",
		value: standardTemplate, // Per user instruction
	},
	{
		id: "scratch",
		title: "Start from Scratch",
		badge: null,
		description: "Build your catalog exactly the way you want it",
		details: ["Blank Catalogue"],
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
	const { onKeyDown, itemProps } = useRadioKeys(
		templates.map((t) => t.id),
		selectedId,
		setSelectedId,
	);

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
		<div className="mx-auto flex w-full flex-col gap-4 px-5 font-product-body sm:px-6 md:gap-6">
			<div
				aria-label="Templates"
				className={cn(
					"grid w-full gap-3",
					direction === "column" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3",
				)}
				onKeyDown={onKeyDown}
				role="radiogroup"
			>
				{templates.map((template, index) => {
					const isSelected = selectedId === template.id;
					const isScratch = template.id === "scratch";

					return (
						<button
							{...itemProps(template.id, index)}
							className={cn(
								"group relative flex h-full w-full touch-manipulation items-center gap-4 rounded-product-card border-[1.5px] bg-product-card p-3 text-left transition-[border-color,box-shadow,transform] sm:p-4 md:flex-col md:justify-between md:gap-4 md:p-6 md:text-center",
								isSelected
									? "border-product-primary-accent shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)]"
									: "border-product-border hover:-translate-y-px hover:border-product-border-strong hover:shadow-product",
								isScratch &&
									!isSelected &&
									"border-dashed border-product-border-strong",
							)}
							key={template.id}
						>
							{template.badge && (
								<Badge
									className="absolute right-3 top-3 z-20"
									variant="primary"
								>
									{template.badge}
								</Badge>
							)}

							<span className="hidden font-product-heading text-lg font-bold text-product-foreground md:block md:pt-4">
								{isScratch ? "" : template.title}
							</span>

							<span
								aria-hidden="true"
								className="flex w-[28%] flex-shrink-0 items-center justify-center sm:w-[32%] md:w-10/12 md:flex-grow"
							>
								{isScratch ? (
									<span className="flex flex-col items-center justify-center gap-1 text-product-muted transition-colors group-hover:text-product-primary-ink">
										<Plus className="h-12 w-12 md:h-16 md:w-16" />
									</span>
								) : (
									<img alt="" className="object-contain" src={template.image} />
								)}
							</span>

							<span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 md:flex-none md:gap-3">
								<span
									className={cn(
										"font-product-heading text-sm font-bold text-product-foreground sm:text-base md:text-lg",
										!isScratch && "md:hidden",
										template.badge && "pr-24 md:pr-0",
									)}
								>
									{template.title}
								</span>
								<span className="text-xs font-medium leading-snug text-product-foreground-accent sm:text-sm md:leading-relaxed">
									{template.description}
								</span>
								{template.details.length > 0 && (
									<span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-product-muted sm:text-xs md:justify-center">
										{template.details.map((detail, detailIndex) => (
											<span className="flex items-center gap-2" key={detail}>
												{detailIndex > 0 && (
													<span
														aria-hidden="true"
														className="h-1 w-1 rounded-full bg-product-border-strong"
													/>
												)}
												{detail}
											</span>
										))}
									</span>
								)}
							</span>
						</button>
					);
				})}
			</div>

			<div className="sticky bottom-0 -mx-5 flex justify-end border-t border-product-border bg-product-card px-5 py-3 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:p-0">
				<Button className="w-full sm:w-auto" onClick={handleSelect} size="lg">
					Select template
				</Button>
			</div>

			<AlertDialog onOpenChange={setShowConfirmModal} open={showConfirmModal}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Change template?</AlertDialogTitle>
						<AlertDialogDescription>
							This will change your existing content. Please save it first to
							not lose progress.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={buttonVariants({ variant: "destructive" })}
							onClick={async () => {
								const res = await updateCatalogueAction(catalogue);
								if (res.success && pendingTemplate)
									executeSelect(pendingTemplate);
							}}
						>
							Save & continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
