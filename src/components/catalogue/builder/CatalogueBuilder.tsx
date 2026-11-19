"use client";
import Catalogue from "@/components/catalogue/view/Catalogue";
import { useEmptyCatalogueOnboarding } from "@/components/catalogue/builder/useEmptyCatalogueOnboarding";
import { useSeedCatalogue } from "@/components/catalogue/builder/useSeedCatalogue";
import { InformModal } from "@/components/modals/InformModal";
import { BuilderStatusProvider } from "@/context/BuilderStatusContext";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { NavigationGuard } from "@/hooks/useBeforeUnload";
import { useAutosave } from "@/hooks/useAutosave";
import { type Catalogue as CatalogueType, UserData } from "@quicktalog/common";

const Builder = ({
	item,
	userData,
	draftUpdatedAt,
	unpublished,
}: {
	item: CatalogueType;
	userData: UserData;
	/** The stored draft's timestamp, which autosave saves against. */
	draftUpdatedAt: string | null;
	unpublished: boolean;
}) => {
	const { resetCatalogue, catalogue } = useCatalogueContext();
	useSeedCatalogue(item);
	useEmptyCatalogueOnboarding(item.id);
	const status = useAutosave({ draftUpdatedAt, unpublished });

	return (
		<BuilderStatusProvider value={status}>
			{/*
			 * Edits save themselves, and a pending one is flushed on the way out, so
			 * this only arms when a save is actually failing - which is the only time
			 * leaving would cost the owner anything. Warning on every unsaved second
			 * would also leave a spare history entry behind after every edit.
			 */}
			<NavigationGuard
				isDirty={status.state === "retrying" || status.conflict}
				onLeave={resetCatalogue}
			/>
			{/*
			 * Another tab or device saved this catalogue. Overwriting would throw away
			 * work the owner cannot see from here, so the only way on is a reload.
			 */}
			<InformModal
				confirmText="Reload"
				isOpen={status.conflict}
				message="This catalogue was changed in another tab or on another device. Reload to carry on from the newer version. Your changes here have not been saved."
				onConfirm={() => window.location.reload()}
				title="Changed somewhere else"
			/>
			<Catalogue item={catalogue} type="edit" userData={userData} />
		</BuilderStatusProvider>
	);
};

export default Builder;
