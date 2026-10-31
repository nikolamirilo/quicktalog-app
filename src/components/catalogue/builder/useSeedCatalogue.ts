"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import type { Catalogue } from "@quicktalog/common";
import { useEffect } from "react";

/**
 * Loads the stored catalogue into the builder. The context outlives the page,
 * so a remount of the same catalogue keeps an unsaved draft; a different
 * catalogue, or a clean draft, takes the server copy.
 */
export function useSeedCatalogue(item: Catalogue): void {
	const context = useCatalogueContext();
	const currentId = (context?.catalogue as Partial<Catalogue> | undefined)?.id;
	const isDirty = context?.isDirty ?? false;

	useEffect(() => {
		if (!context) return;
		if (currentId === item.id && isDirty) return;
		context.seedCatalogue(item);
	}, [item]);
}
