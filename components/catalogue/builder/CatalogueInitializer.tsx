"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Catalogue } from "@quicktalog/common";
import { useEffect } from "react";

const CatalogueInitializer = ({ catalogue }: { catalogue: Catalogue }) => {
	const { updateCatalogue, catalogue: currentCatalogue } =
		useCatalogueContext();

	useEffect(() => {
		if (catalogue && catalogue.id !== currentCatalogue.id) {
			updateCatalogue(catalogue);
		}
	}, [catalogue, updateCatalogue, currentCatalogue.id]);

	return null;
};

export default CatalogueInitializer;
