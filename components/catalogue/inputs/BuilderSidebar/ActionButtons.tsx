"use client";
import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/actions/items";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Eye, Rocket, Save } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import SuccessModal from "@/components/modals/SuccessModal";
import { RxUpdate } from "react-icons/rx";

const ActionButtons = ({ isOpen }: { isOpen: boolean }) => {
	const { catalogue, updateCatalogue: updateContextCatalogue } =
		useCatalogueContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);

	React.useEffect(() => {
		console.log("ActionButtons catalogue state:", catalogue);
	}, [catalogue]);

	const handleSave = async (silent = false) => {
		console.log("Updating catalogue...", catalogue.id);
		const res = await updateCatalogueAction(catalogue);
		if (!res.success) {
			if (!silent) toast.error(res.error || "Failed to save catalogue");
			return null;
		}
		if (!silent) toast.success("Changes saved");
		return catalogue;
	};

	const handlePreview = async () => {
		let currentCatalogueName = catalogue?.name;

		// Always save first
		const savedData = await handleSave(true);
		if (!savedData) return;

		if (savedData.name) {
			currentCatalogueName = savedData.name;
		}

		if (!currentCatalogueName) {
			toast.error("Catalogue has no name/slug");
			return;
		}

		window.open(`/catalogues/${currentCatalogueName}/preview`, "_blank");
	};

	const handlePublish = async () => {
		if (!catalogue?.id) {
			toast.error("Please save the catalogue first");
			return;
		}

		const promise = publishCatalogue(catalogue);
		toast.promise(promise, {
			loading: "Publishing...",
			success: (success) => {
				if (!success) throw new Error("Failed to update status");
				updateContextCatalogue({ status: "active" });
				setIsSuccessModalOpen(true);
				return "Catalogue published successfully";
			},
			error: "Failed to publish catalogue",
		});
	};

	const QUICK_ACTIONS = [
		{ key: "save", icon: Save, label: "Save", onClick: () => handleSave() },
		{ key: "preview", icon: Eye, label: "Preview", onClick: handlePreview },
		{
			key: "publish",
			icon: catalogue?.status === "active" ? RxUpdate : Rocket,
			label: catalogue?.status === "active" ? "Update" : "Publish",
			primary: true,
			onClick: handlePublish,
		},
	];

	return (
		<>
			{QUICK_ACTIONS.map(({ key, icon: Icon, label, primary, onClick }) => (
				<Button
					className={`${isOpen ? "justify-start" : "justify-center"} ${
						primary
							? "bg-product-primary hover:bg-product-primary/90 text-product-foreground"
							: "hover:bg-accent"
					}`}
					key={key}
					size={isOpen ? "sm" : "icon"}
					title={label}
					variant={primary ? "default" : "grayed"}
					onClick={onClick}
				>
					<Icon size={isOpen ? 25 : 30} />
					{isOpen && <span>{label}</span>}
				</Button>
			))}
			<SuccessModal
				isOpen={isSuccessModalOpen}
				onClose={() => setIsSuccessModalOpen(false)}
				catalogueUrl={`/catalogues/${catalogue.name}`}
				type="regular"
			/>
		</>
	);
};

export default ActionButtons;
