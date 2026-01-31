"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { type Catalogue as CatalogueType, UserData } from "@quicktalog/common";
import { useEffect } from "react";
import Catalogue from "../view/Catalogue";

const Builder = ({
	item,
	userData,
}: {
	item: CatalogueType;
	userData: UserData;
}) => {
	const { updateCatalogue, catalogue } = useCatalogueContext();
	useEffect(() => {
		updateCatalogue(item);
	}, []);
	return <Catalogue item={catalogue} type="edit" userData={userData} />;
};

export default Builder;
