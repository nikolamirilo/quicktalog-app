"use client";

import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { refreshDashboardData } from "@/hooks/useDashboardData";
import {
	Eye,
	LayoutTemplate,
	type LucideIcon,
	RefreshCw,
	Rocket,
	Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type BuilderAction = {
	key: "save" | "templates" | "preview" | "publish";
	icon: LucideIcon;
	label: string;
	onClick: () => void;
	disabled: boolean;
	primary: boolean;
};

/**
 * The builder's save / templates / preview / publish actions and the modals
 * they open. The rail (desktop) and the bottom bar (phone) both read these, so
 * the behaviour lives in one place and the two layouts only differ in markup.
 */
export const useBuilderActions = ({
	closePanel,
}: {
	closePanel: () => void;
}) => {
	const { catalogue, updateCatalogue: updateContextCatalogue } =
		useCatalogueContext();
	const { refreshUserData } = useUserContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const router = useRouter();

	const handleSave = async () => {
		try {
			const promise = updateCatalogueAction(catalogue);
			toast.promise(promise, {
				loading: "Saving...",
				success: (res) => {
					if (!res.success) {
						throw new Error(res.error ?? "Failed to save catalogue");
					}
					return "Catalogue saved successfully";
				},
				error: (err) =>
					err instanceof Error ? err.message : "Failed to save catalogue",
			});
			const res = await promise;
			if (!res.success) return null;
			return "data" in res ? res.data : null;
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
		// Open window synchronously so Safari doesn't block it as a popup
		const previewWindow = window.open("about:blank", "_blank");
		const savedCatalogue = await handleSave();
		if (!savedCatalogue || !savedCatalogue.name) {
			previewWindow?.close();
			if (savedCatalogue && !savedCatalogue.name) {
				toast.error("Catalogue has no name/slug");
			}
			return;
		}
		if (previewWindow) {
			previewWindow.opener = null;
			previewWindow.location.href = `/catalogues/${savedCatalogue.name}/preview`;
		}
	};

	const handlePublish = async () => {
		if (!catalogue?.id) {
			toast.error("Please save the catalogue first");
			return;
		}
		const promise = publishCatalogue(catalogue);
		if (catalogue.status !== "active") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (success) => {
					closePanel();
					if (!success) throw new Error("Failed to update status");
					updateContextCatalogue({ status: "active" });
					setIsSuccessModalOpen(true);
					await refreshDashboardData();
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
					closePanel();
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

	const isPublished = catalogue?.status === "active";

	/** Keyed so a renamed action is a compile error, not a render-time throw. */
	const actions: Record<BuilderAction["key"], BuilderAction> = {
		save: {
			key: "save",
			icon: Save,
			label: "Save",
			onClick: () => void handleSave(),
			disabled: false,
			primary: false,
		},
		templates: {
			key: "templates",
			icon: LayoutTemplate,
			label: "Templates",
			onClick: () => {
				closePanel();
				setIsTemplateModalOpen(true);
			},
			disabled: false,
			primary: false,
		},
		preview: {
			key: "preview",
			icon: Eye,
			label: "Preview",
			onClick: () => void handlePreview(),
			disabled: isPublishDisabled,
			primary: false,
		},
		publish: {
			key: "publish",
			icon: isPublished ? RefreshCw : Rocket,
			label: isPublished ? "Update" : "Publish",
			onClick: () => void handlePublish(),
			disabled: isPublishDisabled,
			primary: true,
		},
	};

	return {
		actions,
		catalogueName: catalogue.name,
		isSuccessModalOpen,
		closeSuccessModal: () => setIsSuccessModalOpen(false),
		isTemplateModalOpen,
		closeTemplateModal: () => setIsTemplateModalOpen(false),
	};
};
