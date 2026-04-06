"use client";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { revalidateData } from "@/helpers/server";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/server_actions/catalogue";
import { Eye, LayoutTemplate, Rocket, Save } from "lucide-react";
import { useRouter } from "next/navigation";
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
	const { refreshAll } = useDashboardData("overview");
	const { refreshUserData } = useUserContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
	const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);
	const router = useRouter();
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
			if (!res) throw new Error("Save failed");
			return res.data;
		} catch (err) {
			console.error(err);
			return null;
		}
	};

	const isHeadingEmpty =
		!catalogue.heading ||
		catalogue.heading
			.replace(/<[^>]*>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim().length === 0;

	const isPublishDisabled =
		catalogue.content.length === 0 ||
		catalogue.name.length === 0 ||
		isHeadingEmpty;

	const handlePreview = async () => {
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
		if (catalogue.status === "draft") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (success) => {
					setIsOpen(false);
					if (!success) throw new Error("Failed to update status");
					updateContextCatalogue({ status: "active" });
					setIsSuccessModalOpen(true);
					await refreshAll();
					await revalidateData();
					await refreshUserData();
					router.refresh();
					return "Catalogue published successfully";
				},
				error: "Failed to publish catalogue",
			});
		} else {
			toast.promise(promise, {
				loading: "Updating...",
				success: (success) => {
					setIsOpen(false);
					if (!success) throw new Error("Failed to update status");
					updateContextCatalogue({ status: "active" });
					return "Catalogue updated successfully";
				},
				action: {
					label: "View",
					onClick: () => {
						window.open(`/catalogues/${catalogue.name}`, "_blank");
					},
				},
				error: "Failed to update catalogue",
			});
		}
	};

	const QUICK_ACTIONS = [
		{
			key: "save",
			icon: Save,
			label: catalogue?.status === "active" ? "Save" : "Save as Draft",
			onClick: () => handleSave(),
			disabled: false,
		},
		{
			key: "templates",
			icon: LayoutTemplate,
			label: "Templates",
			onClick: () => {
				setIsOpen(false);
				setIsTemplateModalOpen(true);
			},
			disabled: false,
		},
		{
			key: "preview",
			icon: Eye,
			label: "Preview",
			onClick: handlePreview,
			disabled: isPublishDisabled,
		},
		{
			key: "publish",
			icon: catalogue?.status === "active" ? RxUpdate : Rocket,
			label: catalogue?.status === "active" ? "Update" : "Publish",
			primary: true,
			onClick: handlePublish,
			disabled: isPublishDisabled,
		},
	];
	return (
		<>
			{/* ── Desktop (original, unchanged) ── */}
			<div className="hidden md:contents">
				{QUICK_ACTIONS.map(
					({ key, icon: Icon, label, primary, onClick, disabled }) => (
						<Button
							className={`
                        flex-1
                        ${isOpen ? "md:px-3" : "md:flex-none justify-center md:w-9 md:px-0 flex flex-col h-fit py-2 gap-0"}
                        px-1.5 sm:px-2
                        ${
													primary
														? "bg-product-primary hover:bg-product-primary/90 text-product-foreground"
														: "hover:bg-product-primary/10 hover:border-product-primary/20"
												}
                        hover:scale-105 active:scale-95 transition-all duration-300
                    `}
							disabled={disabled}
							key={key}
							onClick={onClick}
							size="sm"
							title={label}
							variant={primary ? "default" : "grayed"}
						>
							<Icon
								className={`mr-1.5 md:mr-0 ${!isOpen && "md:mr-0 w-4 h-4"} shrink-0 transition-all duration-300`}
							/>
							<span
								className={`${isOpen ? "md:block" : "md:hidden"} block text-[11px] sm:text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis`}
							>
								{label}
							</span>
						</Button>
					),
				)}
			</div>

			{/* ── Mobile fixed bottom tab bar ── */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-background/95 px-2 pb-[env(safe-area-inset-bottom)]">
				{QUICK_ACTIONS.map(
					({ key, icon: Icon, label, primary, onClick, disabled }) => (
						<button
							className={`
                        flex flex-1 flex-col items-center justify-center gap-0.5 py-3.5
                        active:scale-95 transition-all duration-200
                        disabled:opacity-40 disabled:pointer-events-none
                    `}
							disabled={disabled}
							key={key}
							onClick={onClick}
						>
							<Icon className="w-6 h-6" />
							<span className="text-[10px] font-medium">{label}</span>
						</button>
					),
				)}
			</div>

			{/* Spacer so page content isn't hidden behind mobile bar */}
			<div className="md:hidden h-16" />

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
