"use client";
import type {
	Catalogue,
	OverallAnalytics as OverallAnalyticsData,
	PricingPlan,
	Status,
	Usage,
	User,
} from "@quicktalog/common";
import { FileChartColumn, Info, LayoutGrid, Mail, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	deleteItem,
	deleteMultipleItems,
	updateItemStatus,
} from "@/actions/catalogue";
import { AppSectionTitle } from "@/components/dashboard/common/AppHeadings";
import { CatalogueGrid } from "@/components/dashboard/overview/CatalogueGrid";
import { DeleteMultipleItemsModal } from "@/components/dashboard/overview/DeleteMultipleItemsModal";
import { LimitCTAs } from "@/components/dashboard/overview/LimitCTAs";
import { NewsletterTable } from "@/components/dashboard/overview/NewsletterTable";
import {
	OverallAnalytics,
	STAT_EXPLAINERS,
	type StatMetric,
} from "@/components/dashboard/overview/OverallAnalytics";
import { UserProfile } from "@/components/dashboard/overview/UserProfile";
import { InformModal } from "@/components/modals/InformModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import type { NewsletterSubscriber } from "@/types/shared";

type OverviewProps = {
	user: User;
	overallAnalytics: OverallAnalyticsData;
	catalogues: Catalogue[];
	newsletterSubscribers: NewsletterSubscriber[];
	newsletterError: boolean;
	currentPlan: PricingPlan;
	usage: Usage;
	refreshAll: () => Promise<void>;
};

export function Overview({
	user,
	overallAnalytics,
	catalogues,
	newsletterSubscribers,
	newsletterError,
	currentPlan,
	usage,
	refreshAll,
}: OverviewProps) {
	const router = useRouter();
	const { resetCatalogue } = useCatalogueContext();
	const { refreshUserData } = useUserContext();

	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeleteMultipleOpen, setIsDeleteMultipleOpen] = useState(false);
	const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
	// The metric outlives `infoOpen`, so the dialog keeps its text while it
	// animates closed.
	const [infoMetric, setInfoMetric] = useState<StatMetric | null>(null);
	const [infoOpen, setInfoOpen] = useState(false);

	const maxAllowedCatalogues = currentPlan.features.catalogues;
	const hasExcessCatalogues = catalogues.length > maxAllowedCatalogues;

	useEffect(() => {
		if (hasExcessCatalogues) setIsDeleteMultipleOpen(true);
	}, [hasExcessCatalogues]);

	/** After a create, duplicate or delete: the plan usage changed too. */
	async function refreshAfterUsageChange() {
		await refreshAll();
		resetCatalogue();
		await refreshUserData();
		router.refresh();
	}

	async function confirmDelete() {
		if (!itemToDelete) return;
		setIsDeleting(true);
		try {
			const success = await deleteItem(itemToDelete);
			if (success) {
				await refreshAfterUsageChange();
			} else {
				toast.error("Failed to delete catalogue. Please try again.");
			}
		} finally {
			setIsDeleting(false);
			setItemToDelete(null);
		}
	}

	function cancelDelete() {
		if (!isDeleting) setItemToDelete(null);
	}

	async function handleUpdateItemStatus(id: string, status: Status) {
		setStatusBusyId(id);
		try {
			const success = await updateItemStatus(id, status);
			if (!success) {
				// Activating is a plan decision the server can refuse.
				toast.error(
					status === "active"
						? "Could not activate this catalogue. Your plan's limits may not allow it."
						: "Failed to update status. Please try again.",
				);
				return;
			}
			await refreshAll();
			await refreshUserData();
			router.refresh();
		} catch (error) {
			console.error("Error updating item status:", error);
			toast.error("Failed to update status.");
		} finally {
			setStatusBusyId(null);
		}
	}

	async function handleDeleteMultipleCatalogues(selectedIds: string[]) {
		try {
			const success = await deleteMultipleItems(selectedIds);
			if (success) {
				await refreshAfterUsageChange();
				setIsDeleteMultipleOpen(false);
			} else {
				toast.error("Failed to delete some catalogues. Please try again.");
			}
		} catch (error) {
			console.error("Error deleting multiple catalogues:", error);
			toast.error("Failed to delete catalogues. Please try again.");
		}
	}

	function openInfo(metric: StatMetric) {
		setInfoMetric(metric);
		setInfoOpen(true);
	}

	const explainer = infoMetric ? STAT_EXPLAINERS[infoMetric] : null;

	return (
		<div>
			<UserProfile user={user} />

			<section aria-labelledby="dash-stats-h" className="mt-9">
				<AppSectionTitle
					className="mb-4"
					icon={<FileChartColumn />}
					id="dash-stats-h"
				>
					Dashboard
				</AppSectionTitle>
				<OverallAnalytics
					onInfo={openInfo}
					overallAnalytics={overallAnalytics}
				/>
			</section>

			<section aria-labelledby="dash-cats-h" className="mt-9">
				<AppSectionTitle
					className="mb-4"
					icon={<LayoutGrid />}
					id="dash-cats-h"
				>
					Catalogues
				</AppSectionTitle>

				<LimitCTAs currentPlan={currentPlan} usage={usage} />

				<CatalogueGrid
					catalogues={catalogues}
					currentPlan={currentPlan}
					deleteDialogOpen={itemToDelete !== null}
					onChanged={refreshAll}
					onDelete={setItemToDelete}
					onDuplicated={refreshAfterUsageChange}
					onStatusChange={handleUpdateItemStatus}
					statusBusyId={statusBusyId}
					usage={usage}
				/>
			</section>

			<section aria-labelledby="dash-news-h" className="mt-9">
				<AppSectionTitle className="mb-4" icon={<Mail />} id="dash-news-h">
					Newsletter Subscribers
				</AppSectionTitle>
				<NewsletterTable
					error={newsletterError}
					subscribers={newsletterSubscribers}
				/>
			</section>

			<InformModal
				icon={<Trash2 />}
				isOpen={itemToDelete !== null}
				keepOpenOnConfirm
				loading={isDeleting}
				message="Are you sure you want to delete this catalogue? This action cannot be undone."
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				title="Delete Catalogue"
				tone="red"
			/>

			<DeleteMultipleItemsModal
				catalogues={catalogues}
				isOpen={isDeleteMultipleOpen}
				maxAllowed={maxAllowedCatalogues}
				onConfirm={handleDeleteMultipleCatalogues}
			/>

			<InformModal
				cancelText=""
				confirmText="Got it!"
				icon={<Info />}
				isOpen={infoOpen}
				message={explainer?.text ?? ""}
				onCancel={() => setInfoOpen(false)}
				onConfirm={() => setInfoOpen(false)}
				title={explainer ? `${explainer.title} Explained` : ""}
			/>
		</div>
	);
}
