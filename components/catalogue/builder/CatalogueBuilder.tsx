"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { type Catalogue as CatalogueType } from "@/types/catalogue";
import { useEffect } from "react";
import Catalogue from "../view/Catalogue";

const Builder = ({ item }: { item: CatalogueType }) => {
	const { updateCatalogue, catalogue } = useCatalogueContext();
	useEffect(() => {
		updateCatalogue(item);
	}, []);
	return <Catalogue item={catalogue} type="edit" />;
};

export default Builder;
