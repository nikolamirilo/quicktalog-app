"use client";
import { useState } from "react";
import { toast } from "sonner";

import { duplicateItem } from "@/actions/catalogue";
import { useCatalogueNameField } from "@/hooks/useCatalogueNameField";

type Options = {
	catalogueId: string;
	/** The plan has no room for another catalogue (usage from the page load). */
	atCatalogueLimit: boolean;
	/** Refreshes the dashboard after a copy was made. */
	onDuplicated: () => Promise<void>;
};

/**
 * The "Duplicate" flow of a catalogue card: the name dialog, its availability
 * check, the server call and the upgrade dialog when the plan is full. The
 * server re-checks the quota and the name either way.
 */
export function useDuplicateCatalogue({
	catalogueId,
	atCatalogueLimit,
	onDuplicated,
}: Options) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isLimitOpen, setIsLimitOpen] = useState(false);
	const [duplicating, setDuplicating] = useState(false);
	const nameField = useCatalogueNameField({ enabled: isDialogOpen });

	const open = () => {
		// At the plan limit the upgrade dialog explains why, instead of a
		// dead menu item.
		if (atCatalogueLimit) {
			setIsLimitOpen(true);
			return;
		}
		nameField.reset();
		setIsDialogOpen(true);
	};

	const close = () => {
		if (!duplicating) setIsDialogOpen(false);
	};

	const confirm = async () => {
		const name = nameField.value.trim();
		if (!name || nameField.error || duplicating) return;
		setDuplicating(true);
		try {
			const created = await duplicateItem(catalogueId, name);
			if (!created) {
				// `null` is the server's "no": no quota left, or the source is gone.
				nameField.revalidate();
				toast.error(
					"Could not duplicate this catalogue. Your plan may not allow another one.",
					{
						action: {
							label: "View plans",
							onClick: () => setIsLimitOpen(true),
						},
					},
				);
				return;
			}
			setIsDialogOpen(false);
			toast.success(`Catalogue "${created.name}" created.`);
			await onDuplicated();
		} catch (error) {
			console.error("Error duplicating catalogue:", error);
			toast.error("Failed to duplicate the catalogue.");
		} finally {
			setDuplicating(false);
		}
	};

	return {
		nameField,
		isDialogOpen,
		isLimitOpen,
		closeLimit: () => setIsLimitOpen(false),
		duplicating,
		open,
		close,
		confirm,
	};
}
