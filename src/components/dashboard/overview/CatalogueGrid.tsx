"use client";
import type { Catalogue, PricingPlan, Status, Usage } from "@quicktalog/common";
import { useState } from "react";

import { DashboardItem } from "@/components/dashboard/overview/DashboardItem";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import { Button } from "@/components/ui/button";
import { statusOrder } from "@/constants/sort";

type CatalogueGridProps = {
	catalogues: Catalogue[];
	currentPlan: PricingPlan;
	usage: Usage;
	deleteDialogOpen: boolean;
	statusBusyId: string | null;
	onDelete: (name: string) => void;
	onStatusChange: (id: string, status: Status) => void;
	/** Refresh after a change that leaves the plan usage as it is (publish). */
	onChanged: () => Promise<void>;
	/** Refresh after a copy was made (plan usage changed). */
	onDuplicated: () => Promise<void>;
};

const INITIAL_VISIBLE = 8;

export function CatalogueGrid({
	catalogues,
	...cardProps
}: CatalogueGridProps) {
	const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

	if (catalogues.length === 0) {
		return (
			<p className="rounded-product-card border-[1.5px] border-dashed border-product-border-strong bg-product-card/60 px-4 py-7 text-center text-[15px] text-product-foreground-accent">
				No catalogues created yet.
			</p>
		);
	}

	const sorted = [...catalogues].sort((a, b) => {
		const statusDiff = statusOrder[a.status] - statusOrder[b.status];
		if (statusDiff !== 0) return statusDiff;
		return (
			(parseTimestamp(b.updatedAt) || 0) - (parseTimestamp(a.updatedAt) || 0)
		);
	});

	const visible = sorted.slice(0, visibleCount);
	const remaining = sorted.length - visibleCount;

	return (
		<>
			<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 min-[1200px]:grid-cols-3">
				{visible.map((catalogue) => (
					<DashboardItem
						catalogue={catalogue}
						key={catalogue.id}
						{...cardProps}
					/>
				))}
			</div>

			{remaining > 0 && (
				<div className="mt-4 flex justify-center">
					<Button
						onClick={() => setVisibleCount(sorted.length)}
						size="sm"
						variant="outline"
					>
						Show More ({remaining} more)
					</Button>
				</div>
			)}
		</>
	);
}
