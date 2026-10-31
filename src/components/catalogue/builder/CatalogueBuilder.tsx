"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { type Catalogue as CatalogueType, UserData } from "@quicktalog/common";
import { NavigationGuard } from "@/hooks/useBeforeUnload";
import Catalogue from "@/components/catalogue/view/Catalogue";
import { useSeedCatalogue } from "@/components/catalogue/builder/useSeedCatalogue";

const Builder = ({
	item,
	userData,
}: {
	item: CatalogueType;
	userData: UserData;
}) => {
	const { resetCatalogue, catalogue, isDirty } = useCatalogueContext();
	useSeedCatalogue(item);
	return (
		<>
			{/* Leaving on purpose discards the draft; a remount keeps it. */}
			<NavigationGuard isDirty={isDirty} onLeave={resetCatalogue} />
			<Catalogue item={catalogue} type="edit" userData={userData} />
		</>
	);
};

export default Builder;
