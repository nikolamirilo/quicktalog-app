"use client";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/server_actions/catalogue";
import { Eye, LayoutTemplate, Rocket, Save } from "lucide-react";
import React from "react";
import { RxUpdate } from "react-icons/rx";
import { toast } from "sonner";

const ActionButtons = ({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
}) => {
	const { catalogue, updateCatalogue: updateContextCatalogue } =
		useCatalogueContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
	const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);

	React.useEffect(() => {
		console.log("ActionButtons catalogue state:", catalogue);
	}, [catalogue]);

	const handleSave = async () => {
		try {
			console.log("Updating catalogue...", catalogue.id);

			const promise = updateCatalogueAction(catalogue);

			toast.promise(promise, {
				loading: "Saving...",
				success: "Catalogue saved successfully",
				error: "Failed to save catalogue",
			});

			const res = await promise;

			if (!res) {
				throw new Error("Save failed");
			}

			return res.data;
		} catch (err) {
			console.error(err);
			return null;
		}
	};

	const handlePreview = async () => {
		// Always save first
		const savedCatalogue = await handleSave();
		if (!savedCatalogue) return;

		const catalogueName = savedCatalogue.name;

		if (!catalogueName) {
			toast.error("Catalogue has no name/slug");
			return;
		}

		window.open(
			`/catalogues/${catalogueName}/preview`,
			"_blank",
			"noopener,noreferrer",
		);
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
				setIsOpen(false);
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
		{
			key: "templates",
			icon: LayoutTemplate,
			label: "Templates",
			onClick: () => {
				setIsOpen(false);
				setIsTemplateModalOpen(true);
			},
		},
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
					className={`${isOpen ? "flex-1" : "justify-center md:w-9 px-0"} ${
						primary
							? "bg-product-primary hover:bg-product-primary/90 text-product-foreground"
							: "hover:bg-product-primary/10 hover:border-product-primary/20"
					}
            /* Mobile: Allow auto width and horizontal padding, hide explicit size constraint if needed */
            px-2 md:px-2
            ${!isOpen && "md:w-9 md:px-0"} 
            hover:scale-105 active:scale-95
          `}
					key={key}
					// On mobile, we always want "sm" or auto size to fit text. On desktop, follow isOpen logic.
					onClick={onClick}
					size={isOpen ? "sm" : "default"}
					title={label}
					variant={primary ? "default" : "grayed"}
				>
					<Icon className="mr-2 md:mr-0 md:mb-0" size={isOpen ? 25 : 20} />
					<span
						className={`
              /* Mobile: Always visible */
              block
              /* Desktop: Hidden if closed, Block if open */
              ${isOpen ? "md:block" : "md:hidden"} 
            `}
					>
						{label}
					</span>
				</Button>
			))}
			<SuccessModal
				catalogueUrl={`/catalogues/${catalogue.name}`}
				isOpen={isSuccessModalOpen}
				onClose={() => setIsSuccessModalOpen(false)}
				type="regular"
			/>
			{isTemplateModalOpen && (
				<SelectTemplateModal
					isOpen={isTemplateModalOpen}
					onClose={() => setIsTemplateModalOpen(false)}
				/>
			)}
		</>
	);
};

export default ActionButtons;
