"use client";

import { publishCatalogue } from "@/actions/catalogue";
import { useBuilderStatus } from "@/context/BuilderStatusContext";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { refreshDashboardData } from "@/hooks/useDashboardData";
import { captureEvent, PRODUCT_EVENTS } from "@/lib/analytics/events";
import { isHeadingEmpty } from "@/lib/catalogue/heading";
import {
	Eye,
	LayoutTemplate,
	type LucideIcon,
	QrCode,
	RefreshCw,
	Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type BuilderActionCore = {
	key: "templates" | "preview" | "publish" | "qr";
	icon: LucideIcon;
	label: string;
	disabled: boolean;
	primary: boolean;
	/** Marks the action as having something waiting (unpublished changes). */
	badge?: boolean;
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
	const { catalogue, acceptAiChanges, getCatalogue, patchSaved } =
		useCatalogueContext();
	const status = useBuilderStatus();
	const { refreshUserData } = useUserContext();
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [successType, setSuccessType] = useState<"regular" | "edit">("regular");
	const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
	const router = useRouter();

	/**
	 * Everything that has to show the catalogue as it is now - Preview, Publish -
	 * writes the draft first instead of waiting out the autosave debounce. Keeping
	 * AI edits still under review is part of that: they are what the owner is about
	 * to look at or publish.
	 */
	const saveNow = async () => {
		acceptAiChanges?.();
		await status?.flush();
	};

	const isPublishDisabled =
		catalogue.content.length === 0 ||
		catalogue.name.length === 0 ||
		isHeadingEmpty(catalogue.heading);

	const handlePreview = async () => {
		// Open window synchronously so Safari doesn't block it as a popup
		const previewWindow = window.open("about:blank", "_blank");
		await saveNow();
		if (!catalogue.name) {
			previewWindow?.close();
			toast.error("Catalogue has no name/slug");
			return;
		}
		if (previewWindow) {
			previewWindow.opener = null;
			previewWindow.location.href = `/catalogues/${catalogue.name}/preview`;
		}
	};

	const handlePublish = async () => {
		if (!catalogue?.id) {
			toast.error("This catalogue is not ready to publish yet");
			return;
		}
		// The draft is written first, so publishing a catalogue the owner has just
		// edited can never go live with the previous draft. What goes live is read
		// from the context afterwards, not from this render's snapshot.
		await saveNow();
		const promise = publishCatalogue(getCatalogue() as typeof catalogue);
		if (catalogue.status !== "active") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (result) => {
					closePanel();
					if (!result.success) {
						throw new Error(result.error ?? "Failed to update status");
					}
					patchSaved({ status: "active" });
					status?.markPublished();
					// The branch a catalogue only ever takes once: it was not active before.
					captureEvent(PRODUCT_EVENTS.firstPublish, {
						catalogue_id: catalogue.id,
					});
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
					status?.markPublished();
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
			/** Draws the dot on the button: the draft is ahead of the live catalogue. */
			badge: Boolean(status?.unpublished) && isPublished,
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
