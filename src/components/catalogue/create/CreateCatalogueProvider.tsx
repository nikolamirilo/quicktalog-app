"use client";

import dynamic from "next/dynamic";
import { createContext, type ReactNode, useContext, useState } from "react";

import { useCreateCatalogue } from "@/hooks/useCreateCatalogue";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";

/**
 * Both dialogs are needed only after a click, and between them they pull in the
 * select, searchable-select and alert-dialog primitives plus the currency and
 * language lists. Kept out of the first load; `prefetchCreateCatalogueDialogs`
 * warms the chunk from a hover so the click rarely waits for it.
 */
const importInitCatalogueModal = () =>
	import("@/components/catalogue/create/InitCatalogueModal");
const importLimitsModal = () => import("@/components/modals/LimitsModal");

const InitCatalogueModal = dynamic(
	() => importInitCatalogueModal().then((m) => m.InitCatalogueModal),
	{ ssr: false },
);
const LimitsModal = dynamic(
	() => importLimitsModal().then((m) => m.LimitsModal),
	{ ssr: false },
);

export function prefetchCreateCatalogueDialogs() {
	void importInitCatalogueModal();
	void importLimitsModal();
}

type CreateCatalogueContextValue = {
	/**
	 * Starts creating a catalogue: signed-out visitors go to sign-up, users at
	 * their catalogue limit see the limits dialog, everyone else gets the
	 * "Create a Catalogue" dialog.
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
		prefetchBuilder,
		handleButtonClick,
		handleCreateCatalogue,
	} = useCreateCatalogue();
	// Latched, not `isOpen`: unmounting on close would cut the exit animation.
	const [dialogsMounted, setDialogsMounted] = useState(false);

	const openCreateCatalogue = () => {
		setDialogsMounted(true);
		handleButtonClick();
	};

	return (
		<CreateCatalogueContext.Provider value={{ openCreateCatalogue }}>
			{children}
			{dialogsMounted && (
				<>
					<InitCatalogueModal
						isOpen={isModalOpen}
						loading={loading}
						onCancel={() => setIsModalOpen(false)}
						onConfirm={handleCreateCatalogue}
						onNameSettled={prefetchBuilder}
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
				</>
			)}
		</CreateCatalogueContext.Provider>
	);
}

/** The nearest provider's API, or null outside a `CreateCatalogueProvider`. */
export function useCreateCatalogueDialog() {
	return useContext(CreateCatalogueContext);
}
