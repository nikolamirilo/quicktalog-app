"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { createCatalogue } from "@/server_actions/catalogue";

export const useCreateCatalogue = (disabled = false) => {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [limitsModal, setLimitsModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const { catalogue, resetCatalogue } = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();

	const handleCreateCatalogue = async () => {
		setLoading(true);
		if (userData) {
			try {
				const result = await createCatalogue(
					catalogue,
					userData?.currentPlan?.features?.branding,
				);

				if (result.success) {
					toast.success(
						`Catalogue "${result.data.name}" created successfully!`,
					);
					setIsModalOpen(false);

					resetCatalogue();
					await refreshUserData();
					router.refresh();

					setTimeout(() => {
						router.push(`/admin/${result.data.name}/builder`);
					}, 200);
				} else {
					toast.error(result.error || "Failed to create catalogue");
				}
			} catch (_error) {
				toast.error("An unexpected error occurred");
			} finally {
				setLoading(false);
			}
		} else {
			router.push("/auth?mode=signup");
		}
	};

	const handleButtonClick = () => {
		if (!userData) {
			router.push("/auth?mode=signup");
			return;
		}
		if (userData.usage.catalogues >= userData.currentPlan.features.catalogues) {
			setLimitsModal(true);
			return;
		}
		if (!disabled) {
			resetCatalogue();
			setIsModalOpen(true);
		}
	};

	return {
		userData,
		isModalOpen,
		setIsModalOpen,
		limitsModal,
		setLimitsModal,
		loading,
		handleButtonClick,
		handleCreateCatalogue,
	};
};
