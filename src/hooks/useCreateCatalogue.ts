"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createCatalogue } from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";

const SIGN_UP_PATH = "/auth?mode=signup";

/**
 * Opening and submitting the "Create a Catalog" dialog. The form values live
 * in CatalogueContext; the server re-derives the slug, checks the plan limit
 * and decides whether the name is free.
 */
export const useCreateCatalogue = (disabled = false) => {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [limitsModal, setLimitsModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const { catalogue, resetCatalogue } = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();

	/** Resolves to true when the catalogue was created and the builder opens. */
	const handleCreateCatalogue = async (): Promise<boolean> => {
		if (!userData) {
			router.push(SIGN_UP_PATH);
			return false;
		}

		setLoading(true);
		try {
			const result = await createCatalogue(catalogue);
			if (!result.success || !result.data) {
				toast.error(result.error || "Failed to create catalogue");
				return false;
			}

			toast.success(`Catalogue "${result.data.name}" created successfully!`);
			// The values stay in the context while the dialog animates out; the
			// builder replaces them, and the next opening resets them.
			setIsModalOpen(false);
			await refreshUserData();
			router.push(`/admin/${result.data.name}/builder`);
			return true;
		} catch (_error) {
			toast.error("An unexpected error occurred");
			return false;
		} finally {
			setLoading(false);
		}
	};

	const handleButtonClick = () => {
		if (!userData) {
			router.push(SIGN_UP_PATH);
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
