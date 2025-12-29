"use client";
import { useEffect, useRef } from "react";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Catalogue } from "@/types/catalogue";

const CatalogueInitializer = ({ catalogue }: { catalogue: Catalogue }) => {
	const { updateCatalogue, catalogue: currentCatalogue } =
		useCatalogueContext();
	const initialized = useRef(false);

	useEffect(() => {
		if (
			!initialized.current &&
			catalogue &&
			catalogue.id !== currentCatalogue.id
		) {
			console.log("Initializing catalogue context with:", catalogue);
			updateCatalogue(catalogue);
			initialized.current = true;
		}
	}, [catalogue, updateCatalogue, currentCatalogue.id]);

	return null;
};

export default CatalogueInitializer;
