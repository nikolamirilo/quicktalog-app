"use client";
import { AreLimitesReached } from "@quicktalog/common";
import { Plus } from "lucide-react";

import InitCatalogueModal from "@/components/catalogue/modals/InitCatalogueModal";
import LimitsModal from "@/components/modals/LimitsModal";
import { getRequiredPlan } from "@/helpers/client";
import { useCreateCatalogue } from "@/hooks/useCreateCatalogue";

const FloatingActionMenu = ({
	areLimitsReached,
}: {
	areLimitsReached: AreLimitesReached;
}) => {
	const disabled = areLimitsReached["catalogues"];
	const {
		userData,
		isModalOpen,
		setIsModalOpen,
		limitsModal,
		setLimitsModal,
		loading,
		handleButtonClick,
		handleCreateCatalogue,
	} = useCreateCatalogue(disabled);

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<button
				aria-label="Create catalogue"
				className={`w-14 h-14 bg-product-primary hover:product-primary/20 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${
					disabled ? "opacity-50 cursor-not-allowed hover:scale-100" : ""
				}`}
				onClick={handleButtonClick}
			>
				<Plus size={30} />
			</button>

			<InitCatalogueModal
				isOpen={isModalOpen}
				loading={loading}
				onCancel={() => setIsModalOpen(false)}
				onConfirm={handleCreateCatalogue}
			/>
			<LimitsModal
				currentPlan={userData?.currentPlan}
				isOpen={limitsModal}
				onClose={() => setLimitsModal(false)}
				requiredPlan={
					userData
						? getRequiredPlan(userData.currentPlan, "catalogue")
						: undefined
				}
				type="catalogue"
			/>
		</div>
	);
};

export default FloatingActionMenu;
