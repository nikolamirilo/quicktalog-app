"use client";
import {
	publishCatalogue,
	updateCatalogue as updateCatalogueAction,
} from "@/actions/catalogue";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
	ChevronUp,
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

	const ACTIONS = {
		save: {
			key: "save",
			icon: Save,
			label: "Save",
			onClick: () => handleSave(),
			disabled: false,
			primary: false,
		},
		templates: {
			key: "templates",
			icon: LayoutTemplate,
			label: "Templates",
			onClick: () => {
				setIsOpen(false);
				setIsTemplateModalOpen(true);
			},
			disabled: false,
			primary: false,
		},
		preview: {
			key: "preview",
			icon: Eye,
			label: "Preview",
			onClick: handlePreview,
			disabled: isPublishDisabled,
			primary: false,
		},
		publish: {
			key: "publish",
			icon: catalogue?.status !== "active" ? Rocket : RxUpdate,
			label: catalogue?.status !== "active" ? "Publish" : "Update",
			primary: true,
			onClick: handlePublish,
			disabled: isPublishDisabled,
		},
	};

	/** Both layouts read the same definitions; keyed so a renamed action is a compile error, not a render-time throw. */
	const QUICK_ACTIONS = [
		ACTIONS.save,
		ACTIONS.templates,
		ACTIONS.preview,
		ACTIONS.publish,
	];

	const barItemClass =
		"flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2.5 outline-none transition-all duration-200 focus:outline-none focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40";

	const PublishIcon = ACTIONS.publish.icon;

	return (
		<>
			{/* Desktop */}
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

			{/*
			 * Mobile fixed bottom tab bar. Four items, so the centre gap is where the
			 * editor button straddles with no icon under it. No `relative` here: it's
			 * already a containing block, and adding `relative` after Tailwind's
			 * `fixed` would unpin the bar from the bottom of the screen.
			 */}
			<div
				aria-label="Builder actions"
				className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center bg-background/95 px-2 pt-5 pb-[env(safe-area-inset-bottom)]"
				role="toolbar"
			>
				{/* Opens the editor panel, straddling the bar's top edge half in/out. */}
				<button
					aria-label={isOpen ? "Close editor panel" : "Open editor panel"}
					className="absolute left-1/2 top-0 flex h-[3.6rem] w-[3.6rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-none bg-product-primary text-white shadow-sm outline-none transition-transform focus:outline-none focus-visible:outline-none hover:bg-product-primary/90 active:scale-95"
					onClick={() => setIsOpen(!isOpen)}
					style={{ WebkitTapHighlightColor: "transparent" }}
					title={isOpen ? "Close editor panel" : "Open editor panel"}
					type="button"
				>
					{isOpen ? <X size={26} /> : <SlidersHorizontal size={26} />}
				</button>

				{/* Switch into AI mode; the only entry on mobile, since the floating pill (desktop-only) used to collide with this bar. */}
				<button
					aria-label="Ask AI"
					className={barItemClass}
					onClick={() => {
						setIsOpen(false);
						setIsChatOpen(true);
					}}
					type="button"
				>
					<Sparkles className="h-5 w-5" />
					<span className="text-[11px] font-medium">Ask AI</span>
				</button>

				{[ACTIONS.templates, ACTIONS.save].map(
					({ key, icon: Icon, label, onClick, disabled }) => (
						<button
							className={barItemClass}
							disabled={disabled}
							key={key}
							onClick={onClick}
							type="button"
						>
							<Icon className="w-5 h-5" />
							<span className="text-[11px] font-medium">{label}</span>
						</button>
					),
				)}

				{/* Preview + publish share one slot (keeps the editor button in a gap between four items); both gated by the same condition. */}
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label={`${ACTIONS.publish.label} or preview`}
						className={barItemClass}
						disabled={ACTIONS.publish.disabled}
					>
						<span className="relative flex items-center">
							<PublishIcon className="w-5 h-5" />
							<ChevronUp className="h-3 w-3 -mr-2 ml-0.5" />
						</span>
						<span className="text-[11px] font-medium">
							{ACTIONS.publish.label}
						</span>
					</DropdownMenuTrigger>
					{/* Above the builder sidebar (z-1000), below the chat sheet/dialogs; default z-50 would sit behind the sidebar. */}
					<DropdownMenuContent
						align="end"
						className="z-[1010] mb-2 rounded-xl border border-product-border bg-product-background shadow-lg"
						side="top"
					>
						<DropdownMenuItem onClick={ACTIONS.preview.onClick}>
							<Eye className="mr-2 h-4 w-4" />
							{ACTIONS.preview.label}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={ACTIONS.publish.onClick}>
							<PublishIcon className="mr-2 h-4 w-4" />
							{ACTIONS.publish.label}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

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
