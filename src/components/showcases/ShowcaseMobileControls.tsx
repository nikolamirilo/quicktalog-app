"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { VisitCatalogueLink } from "@/components/showcases/VisitCatalogueLink";
import type { ShowcaseItem } from "@/constants/marketing";
import { cn } from "@/lib/ui/cn";

function ArrowButton({
	direction,
	onClick,
}: {
	direction: "previous" | "next";
	onClick: () => void;
}) {
	const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
	return (
		<button
			aria-label={`${direction === "previous" ? "Previous" : "Next"} catalogue`}
			className="grid h-10 w-10 flex-none place-items-center rounded-full border border-product-border-strong bg-product-card shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.05)] transition-[transform,border-color] hover:border-product-primary active:scale-[0.94]"
			onClick={onClick}
			type="button"
		>
			<Icon aria-hidden="true" className="h-[19px] w-[19px]" />
		</button>
	);
}

/** Below `lg`: previous / next arrows around the current title. */
export function ShowcaseMobileHeader({
	title,
	activeIndex,
	onNext,
	onPrevious,
}: {
	title: string;
	activeIndex: number;
	onNext: () => void;
	onPrevious: () => void;
}) {
	return (
		<div className="mb-4 flex items-center gap-2.5 lg:hidden">
			<ArrowButton direction="previous" onClick={onPrevious} />
			<p
				aria-live="polite"
				className="min-w-0 flex-1 overflow-hidden text-center font-product-heading text-lg font-bold tracking-[-0.015em]"
			>
				<span
					className="block truncate duration-200 animate-in fade-in slide-in-from-bottom-1"
					key={activeIndex}
				>
					{title}
				</span>
			</p>
			<ArrowButton direction="next" onClick={onNext} />
		</div>
	);
}

/** Below `lg`: position dots (plain buttons, the current one marked) and the visit button. */
export function ShowcaseMobileFooter({
	items,
	activeIndex,
	onSelect,
}: {
	items: ShowcaseItem[];
	activeIndex: number;
	onSelect: (index: number) => void;
}) {
	return (
		<div className="mt-4 flex flex-col items-center gap-3.5 lg:hidden">
			<div
				aria-label="Catalogue position"
				className="flex items-center gap-1.5"
				role="group"
			>
				{items.map((item, index) => {
					const isActive = index === activeIndex;
					return (
						<button
							aria-current={isActive ? "true" : undefined}
							aria-label={`Go to catalogue ${index + 1}: ${item.title}`}
							className={cn(
								"h-2 rounded-full transition-[width,background-color] duration-300 focus-visible:outline-product-primary",
								isActive
									? "w-[26px] bg-product-primary"
									: "w-2 bg-product-border-strong",
							)}
							key={item.src}
							onClick={() => onSelect(index)}
							type="button"
						/>
					);
				})}
			</div>
			<VisitCatalogueLink
				className="w-full"
				size="lg"
				src={items[activeIndex].src}
			/>
		</div>
	);
}
