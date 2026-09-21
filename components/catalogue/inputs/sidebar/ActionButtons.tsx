"use client";
import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/actions/catalogue";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
	Eye,
	LayoutTemplate,
	Rocket,
	Save,
	SlidersHorizontal,
	Sparkles,
	X,
} from "lucide-react";
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
	const {
		catalogue,
		updateCatalogue: updateContextCatalogue,
		setIsChatOpen,
	} = useCatalogueContext();
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
					setIsOpen(false);
					if (!success) throw new Error("Failed to update status");
					updateContextCatalogue({ status: "active" });
					setIsSuccessModalOpen(true);
					await refreshAll();
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
			label: "Save",
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
			icon: catalogue?.status !== "active" ? Rocket : RxUpdate,
			label: catalogue?.status !== "active" ? "Publish" : "Update",
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
			{/*
			 * The top padding is the strip the editor button below straddles into,
			 * so it never covers the middle item's icon. No `relative` here: this
			 * is already a containing block for the absolute child, and Tailwind
			 * emits `relative` after `fixed`, so adding it would win and unpin the
			 * bar from the bottom of the screen.
			 */}
			<div
				aria-label="Builder actions"
				className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-background/95 px-2 pt-5 pb-[env(safe-area-inset-bottom)]"
				role="toolbar"
			>
				{/*
				 * Opens the editor panel. Positioned against this bar rather than
				 * the sidebar's own row, so "40% in, 60% out" is exact: the
				 * translate is a share of the button's own height.
				 */}
				<button
					aria-label={isOpen ? "Close editor panel" : "Open editor panel"}
					className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-[60%] items-center justify-center rounded-full border-none bg-product-primary text-white shadow-sm outline-none transition-transform focus:outline-none hover:bg-product-primary/90 active:scale-95"
					onClick={() => setIsOpen(!isOpen)}
					style={{ WebkitTapHighlightColor: "transparent" }}
					title={isOpen ? "Close editor panel" : "Open editor panel"}
					type="button"
				>
					{isOpen ? <X size={22} /> : <SlidersHorizontal size={22} />}
				</button>
				{/*
				 * The switch into AI mode. On mobile this is the only way in: the
				 * floating pill is desktop-only, because a pill hovering over the
				 * page at a guessed offset is what used to collide with this bar.
				 * Opening the chat hides this whole bar, so the two never overlap.
				 *
				 * Styled like every other item: a colour of its own read as a
				 * selected tab, and nothing here is selected until it is tapped.
				 */}
				<button
					aria-label="Ask AI"
					className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-all duration-200 active:scale-95"
					onClick={() => {
						setIsOpen(false);
						setIsChatOpen(true);
					}}
					type="button"
				>
					<Sparkles className="h-5 w-5" />
					<span className="text-[11px] font-medium">Ask AI</span>
				</button>
				{QUICK_ACTIONS.map(({ key, icon: Icon, label, onClick, disabled }) => (
					<button
						className={`
                        flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5
                        active:scale-95 transition-all duration-200
                        disabled:opacity-40 disabled:pointer-events-none
                    `}
						disabled={disabled}
						key={key}
						onClick={onClick}
					>
						<Icon className="w-5 h-5" />
						<span className="text-[11px] font-medium">{label}</span>
					</button>
				))}
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
