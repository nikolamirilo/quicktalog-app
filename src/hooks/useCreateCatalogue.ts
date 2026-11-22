"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { generateUniqueSlug } from "@quicktalog/common";

import { createCatalogue } from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";

const SIGN_UP_PATH = "/auth?mode=signup";

/**
 * Opening and submitting the "Create a Catalogue" dialog. The form values live
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
				setLoading(false);
				return false;
			}

			toast.success(`Catalogue "${result.data.name}" created successfully!`);
			// Straight to the builder. The dialog stays up, still showing
			// "Creating...", until the navigation replaces it: closing it first left
			// the home page on screen with nothing happening. Refreshing the account
			// data is not awaited for the same reason - it only feeds the dashboard,
			// which is not where we are going.
			router.push(`/admin/${result.data.name}/builder`);
			void refreshUserData();
			// Deliberately still loading: the button must not go back to "Create
			// Catalogue" for the frame between here and the builder rendering.
			return true;
		} catch (_error) {
			toast.error("An unexpected error occurred");
			setLoading(false);
			return false;
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

	/**
	 * Warms the builder route while the owner fills the dialog in, so the push after
	 * "Create Catalogue" renders from the client cache instead of waiting for the
	 * server. The slug is not known yet, so this prefetches the segment, not the
	 * finished page.
	 */
	const prefetchBuilder = (name: string) => {
		const slug = generateUniqueSlug(name);
		if (slug) router.prefetch(`/admin/${slug}/builder`);
	};

	return {
		userData,
		isModalOpen,
		setIsModalOpen,
		prefetchBuilder,
		limitsModal,
		setLimitsModal,
		loading,
		handleButtonClick,
		handleCreateCatalogue,
	};
};
