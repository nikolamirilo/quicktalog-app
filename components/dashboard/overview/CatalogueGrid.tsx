"use client";
import { statusOrder } from "@/constants/sort";
import type { Catalogue, Status, Usage } from "@quicktalog/common";
import DashboardItem from "../components/DashboardItem";

export interface CatalogueGridProps {
	catalogues: Catalogue[];
	duplicatingId: string | null;
	handleDeleteItem: (name: string) => void;
	handleDuplicateCatalogue: (id: string, name: string) => void;
	handleUpdateItemStatus: (id: string, status: Status) => void;
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
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
			{catalogues.length === 0 && (
				<div className="col-span-full text-product-foreground-accent text-base sm:text-lg">
					No catalogues created yet.
				</div>
			)}

			{catalogues
				.sort((a: Catalogue, b: Catalogue) => {
					const statusDiff = statusOrder[a.status] - statusOrder[b.status];
					if (statusDiff !== 0) return statusDiff;
					return (
						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
					);
				})
				.map((catalogue: Catalogue, index: number) => (
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
	);
}
