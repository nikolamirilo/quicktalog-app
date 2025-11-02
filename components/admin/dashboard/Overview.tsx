"use client";
import { Catalogue, Status, tiers } from "@quicktalog/common";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BiScan } from "react-icons/bi";
import { FiCpu, FiFileText, FiTool } from "react-icons/fi";
import { IoCreateOutline } from "react-icons/io5";
import { LuSquareMenu } from "react-icons/lu";
import { RiSparkling2Line } from "react-icons/ri";
import { TbFileAnalytics } from "react-icons/tb";
import {
	deleteItem,
	deleteMultipleItems,
	duplicateItem,
	updateItemStatus,
} from "@/actions/items";
import CTASection from "@/components/common/CTASection";
import DeleteMultipleItemsModal from "@/components/modals/DeleteMultipleItemsModal";
import { Button } from "@/components/ui/button";
import { statusOrder } from "@/constants/sort";
import { OverviewProps } from "@/types/components";
import InformModal from "../../modals/InformModal";
import DashboardItem from "./components/DashboardItem";
import OverallAnalytics from "./components/OverallAnalytics";
import UserProfile from "./components/UserProfile";

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

	async function handleDeleteItem(id: string) {
		setItemToDelete(id);
		setIsModalOpen(true);
	}

	async function confirmDelete() {
		if (itemToDelete) {
			await deleteItem(itemToDelete);
			await refreshAll();
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
				<div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
					<Button
						className="w-9/12 sm:w-fit"
						disabled={usage.catalogues >= matchedTier.features.catalogues}
						onClick={() => {
							router.push("/admin/create");
						}}
					>
						<IoCreateOutline
							className="sm:w-5 sm:h-5 md:w-6 md:h-6"
							size={18}
						/>{" "}
						Create Catalogue
					</Button>
					<Button
						className={`${planId < 1 && "animate-pulse"} w-9/12 sm:w-fit`}
						disabled={
							usage.prompts >= matchedTier.features.ai_prompts ||
							usage.catalogues >= matchedTier.features.catalogues
						}
						onClick={() => {
							router.push("/admin/create/ai");
						}}
						variant="outline"
					>
						<RiSparkling2Line
							className="sm:w-5 sm:h-5 md:w-6 md:h-6"
							size={18}
						/>{" "}
						Generate with AI
					</Button>
					<Button
						className="w-9/12 sm:w-fit"
						disabled={
							usage.ocr >= matchedTier.features.ocr_ai_import ||
							usage.catalogues >= matchedTier.features.catalogues
						}
						onClick={() => {
							router.push("/admin/create/ocr");
						}}
						variant="outline"
					>
						<BiScan className="sm:w-5 sm:h-5 md:w-6 md:h-6" size={18} />
						Scan & Import Catalogue
					</Button>
				</div>
				{usage.catalogues >= matchedTier.features.catalogues && (
					<CTASection
						ctaLabel="Upgrade plan"
						href="/pricing"
						subtitle=" Upgrade your plan to get more catalogues, features, and higher limits."
						title="You've reached your current catalogue limit"
					/>
				)}
				<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
					{catalogues.length === 0 && (
						<div className="col-span-full text-product-foreground-accent text-base sm:text-lg">
							No catalogues created yet.
						</div>
					)}

					{catalogues
						.sort((a, b) => {
							const statusDiff = statusOrder[a.status] - statusOrder[b.status];
							if (statusDiff !== 0) return statusDiff;
							return (
								new Date(b.updated_at).getTime() -
								new Date(a.updated_at).getTime()
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
				onCancel={() => setIsInfoModalOpen(false)}
				onConfirm={() => setIsInfoModalOpen(false)}
				title={`${currentMetric} Explained`}
			/>
		</div>
	);
};

export default Overview;
