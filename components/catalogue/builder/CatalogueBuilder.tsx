"use client";
import React, { useEffect } from "react";
import Catalogue from "@/components/catalogue/display/Catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";

const Builder = ({ item }: { item: Catalogue }) => {
	const { updateCatalogue, catalogue } = useCatalogueContext();
	useEffect(() => {
		updateCatalogue(item);
	}, []);
	return <Catalogue item={catalogue} type="edit" />;
};

export default Builder;
