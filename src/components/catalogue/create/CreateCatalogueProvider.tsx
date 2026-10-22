"use client";

import { createContext, type ReactNode, useContext } from "react";

import { InitCatalogueModal } from "@/components/catalogue/create/InitCatalogueModal";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { useCreateCatalogue } from "@/hooks/useCreateCatalogue";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";

type CreateCatalogueContextValue = {
	/**
	 * Starts creating a catalogue: signed-out visitors go to sign-up, users at
	 * their catalogue limit see the limits dialog, everyone else gets the
	 * "Create a Catalog" dialog.
	 */
	openCreateCatalogue: () => void;
};

const CreateCatalogueContext =
	createContext<CreateCatalogueContextValue | null>(null);

/**
 * Owns the create-catalogue and limits dialogs once per page. Any number of
 * `CreateCatalogueButton`s (or custom triggers via `useCreateCatalogueDialog`)
 * inside it share the same pair of dialogs.
 */
export function CreateCatalogueProvider({ children }: { children: ReactNode }) {
	const {
		userData,
		isModalOpen,
		setIsModalOpen,
		limitsModal,
		setLimitsModal,
		loading,
		handleButtonClick,
		handleCreateCatalogue,
	} = useCreateCatalogue();

	return (
		<CreateCatalogueContext.Provider
			value={{ openCreateCatalogue: handleButtonClick }}
		>
			{children}
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
		</CreateCatalogueContext.Provider>
	);
}

/** The nearest provider's API, or null outside a `CreateCatalogueProvider`. */
export function useCreateCatalogueDialog() {
	return useContext(CreateCatalogueContext);
}
