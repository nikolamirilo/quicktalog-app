"use client";
import { statusOrder } from "@/constants/sort";
import type { Catalogue, Status, Usage } from "@quicktalog/common";
import { useState } from "react";
import DashboardItem from "../components/DashboardItem";

export interface CatalogueGridProps {
	catalogues: Catalogue[];
	duplicatingId: string | null;
	handleDeleteItem: (name: string) => void;
	handleDuplicateCatalogue: (id: string, name: string) => void;
	handleUpdateItemStatus: (id: string, status: Status, name?: string) => void;
	isLinkCopied: boolean;
	isModalOpen: boolean;
	matchedTier: any;
	setIsLinkCopied: (value: boolean) => void;
	sourceConfig: Record<
		string,
		{ label: string; className: string; Icon: React.ElementType }
	>;
	statusColors: Record<string, string>;
	usage: Usage;
}

const INITIAL_VISIBLE = 8;

export default function CatalogueGrid({
	catalogues,
	duplicatingId,
	handleDeleteItem,
	handleDuplicateCatalogue,
	handleUpdateItemStatus,
	isLinkCopied,
	isModalOpen,
	matchedTier,
	setIsLinkCopied,
	sourceConfig,
	statusColors,
	usage,
}: CatalogueGridProps) {
	const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

	const sorted = [...catalogues].sort((a: Catalogue, b: Catalogue) => {
		const statusDiff = statusOrder[a.status] - statusOrder[b.status];
		if (statusDiff !== 0) return statusDiff;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});

	const visible = sorted.slice(0, visibleCount);
	const remaining = sorted.length - visibleCount;

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
				{catalogues.length === 0 && (
					<div className="col-span-full text-product-foreground-accent text-base sm:text-lg">
						No catalogues created yet.
					</div>
				)}

				{visible.map((catalogue: Catalogue, index: number) => (
					<DashboardItem
						catalogue={catalogue}
						duplicatingId={duplicatingId}
						handleDeleteItem={handleDeleteItem}
						handleDuplicateCatalogue={handleDuplicateCatalogue}
						handleUpdateItemStatus={handleUpdateItemStatus}
						isLinkCopied={isLinkCopied}
						isModalOpen={isModalOpen}
						key={`dashboard-item-${index}`}
						matchedTier={matchedTier}
						setIsLinkCopied={setIsLinkCopied}
						sourceConfig={sourceConfig}
						statusColors={statusColors}
						usage={usage}
					/>
				))}
			</div>

			{remaining > 0 && (
				<div className="mt-4 flex justify-center">
					<button
						className="px-6 py-2 rounded-lg border border-product-border text-product-foreground hover:bg-product-background-hover transition-colors duration-200 text-sm font-medium"
						onClick={() => setVisibleCount(sorted.length)}
					>
						Show More ({remaining} more)
					</button>
				</div>
			)}
		</>
	);
}
