"use client";

import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/actions/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { refreshDashboardData } from "@/hooks/useDashboardData";
import { isHeadingEmpty } from "@/lib/catalogue/heading";
import {
	Eye,
	LayoutTemplate,
	type LucideIcon,
	QrCode,
	RefreshCw,
	Rocket,
	Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type BuilderActionCore = {
	key: "save" | "templates" | "preview" | "publish" | "qr";
	icon: LucideIcon;
	label: string;
	disabled: boolean;
	primary: boolean;
};

/** A button or a link, never both: a link has to stay an anchor (see `qr`). */
export type BuilderAction = BuilderActionCore &
	({ onClick: () => void; href?: never } | { href: string; onClick?: never });

/**
 * The builder's save / templates / preview / QR / publish actions and the modals
 * they open. The rail (desktop) and the bottom bar (phone) both read these, so
 * the behaviour lives in one place and the two layouts only differ in markup.
 */
export const useBuilderActions = ({
	closePanel,
}: {
	closePanel: () => void;
}) => {
	const { catalogue, acceptAiChanges, markSaved, patchSaved } =
		useCatalogueContext();
	const { refreshUserData } = useUserContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [successType, setSuccessType] = useState<"regular" | "edit">("regular");
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const router = useRouter();

	const handleSave = async () => {
		// Saving (and Preview, which saves first) keeps AI edits still under review.
		acceptAiChanges?.();
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
			markSaved(catalogue);
			return "data" in res ? res.data : null;
		} catch (err) {
			console.error(err);
			return null;
		}
	};

	const isPublishDisabled =
		catalogue.content.length === 0 ||
		catalogue.name.length === 0 ||
		isHeadingEmpty(catalogue.heading);

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
		acceptAiChanges?.();
		const promise = publishCatalogue(catalogue);
		if (catalogue.status !== "active") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (result) => {
					closePanel();
					if (!result.success) {
						throw new Error(result.error ?? "Failed to update status");
					}
					patchSaved({ status: "active" });
					setSuccessType("regular");
					setIsSuccessModalOpen(true);
					await refreshDashboardData();
					await refreshUserData();
					router.refresh();
					return "Catalogue published successfully";
				},
				error: (err: Error) => err.message || "Failed to publish catalogue",
			});
		} else {
			toast.promise(promise, {
				loading: "Updating...",
				success: (result) => {
					closePanel();
					if (!result.success) {
						throw new Error(result.error ?? "Failed to update status");
					}
					patchSaved({ status: "active" });
					setSuccessType("edit");
					setIsSuccessModalOpen(true);
					return "Catalogue updated successfully";
				},
				action: {
					label: "View",
					onClick: () => {
						window.open(`/catalogues/${catalogue.name}`, "_blank");
					},
				},
				error: (err: Error) => err.message || "Failed to update catalogue",
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
		qr: {
			key: "qr",
			icon: QrCode,
			label: "QR code",
			href: `/admin/${catalogue.name}/qr-editor`,
			disabled: false,
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
		successType,
		closeSuccessModal: () => setIsSuccessModalOpen(false),
		isTemplateModalOpen,
		closeTemplateModal: () => setIsTemplateModalOpen(false),
	};
};
