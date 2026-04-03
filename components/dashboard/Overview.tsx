"use client";
import DeleteMultipleItemsModal from "@/components/modals/DeleteMultipleItemsModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { revalidateData } from "@/helpers/server";
import {
	deleteItem,
	deleteMultipleItems,
	duplicateItem,
	updateItemStatus,
} from "@/server_actions/catalogue";
import { OverviewProps } from "@/types/shared";
import { Status, tiers } from "@quicktalog/common";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiTool, FiCpu, FiFileText } from "react-icons/fi";
import { LuSquareMenu } from "react-icons/lu";
import { TbFileAnalytics } from "react-icons/tb";
import InformModal from "../modals/InformModal";
import OverallAnalytics from "./components/OverallAnalytics";
import UserProfile from "./components/UserProfile";
import CatalogueGrid from "./overview/CatalogueGrid";
import QuickActions from "./overview/QuickActions";

const Overview = ({
	user,
	overallAnalytics,
	catalogues,
	refreshAll,
	planId,
	usage,
}: OverviewProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [currentMetric, setCurrentMetric] = useState("");
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] =
		useState(false);
	const [isLinkCopied, setIsLinkCopied] = useState(false);
	const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
	const router = useRouter();
	const matchedTier = tiers.find((tier) => tier.id == planId);
	const maxAllowedCatalogues = matchedTier?.features.catalogues || 0;
	const hasExcessCatalogues = catalogues.length > maxAllowedCatalogues;
	const { resetCatalogue } = useCatalogueContext();
	const { refreshUserData } = useUserContext();

	async function handleDeleteItem(name: string) {
		setItemToDelete(name);
		setIsModalOpen(true);
	}

	async function confirmDelete() {
		if (itemToDelete) {
			const success = await deleteItem(itemToDelete);
			if (success) {
				await refreshAll();
				resetCatalogue();
				await revalidateData();
				await refreshUserData();
				router.refresh();
			} else {
				alert("Failed to delete catalogue. Please try again.");
			}
			setItemToDelete(null);
			setIsModalOpen(false);
		}
	}

	const sourceConfig: Record<
		string,
		{ label: string; className: string; Icon: React.ElementType }
	> = {
		builder: {
			label: "Builder",
			className: "bg-blue-100 text-blue-700",
			Icon: FiTool,
		},
		ai_prompt: {
			label: "AI Prompt",
			className: "bg-purple-100 text-purple-700",
			Icon: FiCpu,
		},
		ocr_import: {
			label: "OCR Import",
			className: "bg-yellow-100 text-orange-700",
			Icon: FiFileText,
		},
	};

	const statusColors: Record<string, string> = {
		active: "text-white bg-[#00875A]",
		inactive: "text-white bg-product-secondary",
		draft: "text-white bg-product-primary",
		"in preparation": "text-white bg-blue-600",
		error: "text-white bg-red-600",
	};

	async function handleDuplicateCatalogue(id: string, name: string) {
		setDuplicatingId(id);
		try {
			await duplicateItem(id, name);
			await refreshAll();
			await revalidateData();
			await refreshUserData();
			router.refresh();
		} catch (error) {
			console.error("Error duplicating item:", error);
			alert("Failed to duplicate item.");
		} finally {
			setDuplicatingId(null);
		}
	}

	async function handleUpdateItemStatus(id: string, status: Status) {
		try {
			await updateItemStatus(id, status);
			await refreshAll();
		} catch (error) {
			console.error("Error updating item status:", error);
			alert("Failed to update status.");
		} finally {
			setDuplicatingId(null);
		}
	}

	function cancelDelete() {
		setItemToDelete(null);
		setIsModalOpen(false);
	}

	async function handleDeleteMultipleCatalogues(selectedIds: string[]) {
		try {
			const success = await deleteMultipleItems(selectedIds);
			if (success) {
				await refreshAll();
				await revalidateData();
				await refreshUserData();
				router.refresh();
				setIsDeleteMultipleModalOpen(false);
			} else {
				alert("Failed to delete some catalogues. Please try again.");
			}
		} catch (error) {
			console.error("Error deleting multiple catalogues:", error);
			alert("Failed to delete catalogues. Please try again.");
		}
	}

	useEffect(() => {
		if (hasExcessCatalogues) {
			setIsDeleteMultipleModalOpen(true);
		}
	}, [hasExcessCatalogues]);

	useEffect(() => {
		refreshAll();
	}, []);

	return (
		<div className="max-w-5xl space-y-6">
			<UserProfile user={user} />

			<section className="mb-8 sm:mb-12 animate-fade-in">
				<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
					<TbFileAnalytics className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" />{" "}
					Dashboard
				</h2>
				<OverallAnalytics
					overallAnalytics={overallAnalytics}
					setCurrentMetric={setCurrentMetric}
					setIsInfoModalOpen={setIsInfoModalOpen}
				/>
			</section>

			{/* Catalogues */}
			<section className="mb-8 sm:mb-12 animate-fade-in">
				<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
					<LuSquareMenu className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" />
					Catalogues
				</h2>

				<QuickActions matchedTier={matchedTier} planId={planId} usage={usage} />

				<CatalogueGrid
					catalogues={catalogues}
					duplicatingId={duplicatingId}
					handleDeleteItem={handleDeleteItem}
					handleDuplicateCatalogue={handleDuplicateCatalogue}
					handleUpdateItemStatus={handleUpdateItemStatus}
					isLinkCopied={isLinkCopied}
					isModalOpen={isModalOpen}
					matchedTier={matchedTier}
					setIsLinkCopied={setIsLinkCopied}
					sourceConfig={sourceConfig}
					statusColors={statusColors}
					usage={usage}
				/>
			</section>

			<InformModal
				isOpen={isModalOpen}
				message="Are you sure you want to delete this catalogue? This action cannot be undone."
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
				title="Delete Catalogue"
			/>

			<DeleteMultipleItemsModal
				catalogues={catalogues}
				isOpen={isDeleteMultipleModalOpen}
				maxAllowed={maxAllowedCatalogues}
				onConfirm={handleDeleteMultipleCatalogues}
			/>

			<InformModal
				cancelText=""
				confirmText="Got it!"
				isOpen={isInfoModalOpen}
				message={
					currentMetric === "Total Views"
						? "This shows the total number of times your catalogues have been viewed by visitors. It includes all page visits across all your catalogues."
						: currentMetric === "Total Visitors"
							? "This represents the number of individuals who have visited your catalogues. Each person is counted only once per day, regardless of how many times they visit your catalogue on that day."
							: currentMetric === "Total Items"
								? "This displays the total number of catalogues you have created. Each catalogue represents a different business or service offering."
								: currentMetric === "Newsletter"
									? "This shows how many people have subscribed to your newsletter service. These are users who have opted in to receive updates from you."
									: "Select a metric to see its explanation."
				}
				onConfirm={() => setIsInfoModalOpen(false)}
				title={`${currentMetric} Explained`}
			/>
		</div>
	);
};

export default Overview;
