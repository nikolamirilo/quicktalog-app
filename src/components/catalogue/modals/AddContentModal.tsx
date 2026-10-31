"use client";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { AppDialogContent } from "@/components/modals/AppDialog";
import { AlertDialog, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { ContentBlock, UserData } from "@quicktalog/common";
import {
	countPlanSections,
	normalizeBlock,
} from "@/lib/catalogue/content-blocks";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { useEffect, useState } from "react";
import { cn } from "@/lib/ui/cn";
import BlockConfigForm from "./content/BlockConfigForm";
import BlockConfigHeader, {
	type ContentOption,
} from "./content/BlockConfigHeader";
import {
	BuilderDialogBody,
	BuilderDialogClose,
	BuilderDialogFooter,
	builderDialogFrame,
} from "./content/BuilderDialog";
import { SectionTypePicker } from "./content/SectionTypePicker";

interface AddContentModalProps {
	isOpen: boolean;
	/** Also clears the edit target, so the dialog always closes empty. */
	onClose: () => void;
	editingBlock?: ContentBlock | null;
	userData: UserData;
}

const DEFAULT_BLOCK_DATA = {
	name: "",
	layout: "variant_1",
	items: [] as any[],
	code: "",
	content: "",
	divider: {
		spacing: 2,
		border: {
			isEnabled: true,
			style: "solid",
			thickness: 1,
			color: "#000000",
			opacity: 100,
		},
	},
	showHeading: true,
	isExpanded: true,
};

const AddContentModal = ({
	isOpen,
	onClose,
	editingBlock,
	userData,
}: AddContentModalProps) => {
	const { catalogue, addBlock, updateBlock, setIsSidebarOpen } =
		useCatalogueContext() || {};
	const [selectedOption, setSelectedOption] = useState<ContentOption>("items");
	const [showLimitsModal, setShowLimitsModal] = useState(false);
	const [blockData, setBlockData] = useState({ ...DEFAULT_BLOCK_DATA });

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
			if (editingBlock) {
				// A stored row may still carry the legacy `category`/`container` key.
				const block = normalizeBlock(editingBlock);
				setSelectedOption(block.type as ContentOption);
				setBlockData({
					name: (block as any).name || "",
					layout: (block as any).layout || "variant_1",
					items: (block as any).items || [],
					code: (block as any).code || "",
					content: (block as any).content || "",
					divider:
						block.type === "divider"
							? {
									spacing: (block as any).spacing,
									border: (block as any).border,
								}
							: {
									spacing: 2,
									border: {
										isEnabled: true,
										style: "solid",
										thickness: 1,
										color: "#000000",
										opacity: 100,
									},
								},
					showHeading: (block as any).showHeading ?? true,
					isExpanded: (block as any).isExpanded ?? true,
				});
			} else {
				setSelectedOption("items");
				setBlockData({ ...DEFAULT_BLOCK_DATA });
			}
		}
	}, [isOpen, editingBlock]);

	const isLocked = (key: ContentOption) => {
		if (!userData?.currentPlan?.features?.sections) return false;

		switch (key) {
			// `!== true`, not `=== false`: a tier that omits a flag must not get
			// the block. Matches `isSectionTypeLocked` on the agent path.
			case "divider":
				return userData.currentPlan.features.sections.divider !== true;
			case "embedding":
				return userData.currentPlan.features.sections.embedding !== true;
			case "custom_visual":
				return userData.currentPlan.features.sections.customVisual !== true;
			default:
				return false;
		}
	};

	const checkLimits = () => {
		const sectionsLimit =
			userData?.currentPlan?.features?.sections_per_catalogue;

		if (
			sectionsLimit !== "unlimited" &&
			sectionsLimit !== undefined &&
			!editingBlock
		) {
			if (countPlanSections(catalogue.content) >= sectionsLimit) {
				return "items";
			}
		}
		return null;
	};

	const handleAdd = () => {
		if (!catalogue || !addBlock || !updateBlock) return;

		const limitReached = checkLimits();
		if (limitReached) {
			setShowLimitsModal(true);
			return;
		}

		// An edit is a patch on the live section, so it carries no id or order and
		// no items: the items in this form are a snapshot from when the dialog
		// opened, and the section may have gained some since.
		const existing = editingBlock ? normalizeBlock(editingBlock) : null;
		let newBlock: any = editingBlock
			? { type: selectedOption }
			: { id: crypto.randomUUID(), type: selectedOption };

		if (selectedOption === "items") {
			newBlock = {
				...newBlock,
				name: blockData.name,
				showHeading: blockData.showHeading,
				isExpanded: blockData.isExpanded,
				layout: blockData.layout,
				...(existing?.type === "items" ? {} : { items: blockData.items ?? [] }),
			};
		} else if (selectedOption === "embedding") {
			newBlock = {
				...newBlock,
				name: blockData.name || undefined,
				code: blockData.code,
			};
		} else if (selectedOption === "custom_visual") {
			newBlock = {
				...newBlock,
				name: blockData.name || undefined,
				code: blockData.code,
			};
		} else if (selectedOption === "text") {
			newBlock = {
				...newBlock,
				name: blockData.name || undefined,
				content: blockData.content || "<p>New text block</p>",
			};
		} else if (selectedOption === "divider") {
			newBlock = {
				...newBlock,
				name: blockData.name || undefined,
				spacing: blockData.divider.spacing,
				border: blockData.divider.border,
			};
		}

		// By id, and appended by the context: a position read when this dialog
		// opened can belong to another section by now, and the whole array
		// rebuilt from here would drop whatever else has changed since.
		if (editingBlock) updateBlock(editingBlock.id, newBlock);
		else addBlock(newBlock);
		onClose();
	};

	const isFormValid = () => {
		if (isLocked(selectedOption)) return false;
		if (selectedOption === "items")
			return (blockData.name?.trim().length ?? 0) > 0;
		if (selectedOption === "embedding")
			return (blockData.code?.trim().length ?? 0) > 0;
		if (selectedOption === "custom_visual")
			return (blockData.code?.trim().length ?? 0) > 0;
		return true;
	};

	const locked = isLocked(selectedOption);

	return (
		<>
			<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
				<AppDialogContent
					className={cn(
						builderDialogFrame,
						"max-w-[880px] md:h-[min(600px,calc(100dvh-48px))] md:flex-row",
					)}
				>
					{/* Section type: a scrolling pill bar on phones, a side list from md. */}
					<div className="flex flex-none flex-col border-b border-product-border bg-product-card px-4 pt-3 md:w-56 md:border-b-0 md:border-r md:bg-product-background-hero md:px-3.5 md:pb-4 md:pt-5">
						<div className="flex items-center justify-between gap-3 md:px-1.5">
							<AlertDialogTitle className="text-lg">
								{editingBlock ? "Edit section" : "Add section"}
							</AlertDialogTitle>
							<BuilderDialogClose
								className="mt-0 md:hidden"
								onClick={onClose}
							/>
						</div>
						<SectionTypePicker
							className="mt-1.5 md:mt-4"
							isLocked={isLocked}
							onChange={setSelectedOption}
							value={selectedOption}
						/>
					</div>

					<div className="flex min-h-0 min-w-0 flex-1 flex-col">
						<BlockConfigHeader
							onClose={onClose}
							selectedOption={selectedOption}
						/>
						<BuilderDialogBody>
							<BlockConfigForm
								blockData={blockData}
								locked={locked}
								selectedOption={selectedOption}
								setBlockData={setBlockData}
							/>
						</BuilderDialogBody>
						<BuilderDialogFooter>
							<Button onClick={onClose} variant="outline">
								Cancel
							</Button>
							<Button disabled={!isFormValid()} onClick={handleAdd}>
								{editingBlock ? "Save section" : "Add section"}
							</Button>
						</BuilderDialogFooter>
					</div>
				</AppDialogContent>
			</AlertDialog>

			<LimitsModal
				currentPlan={userData?.currentPlan}
				isOpen={showLimitsModal}
				onClose={() => setShowLimitsModal(false)}
				requiredPlan={getRequiredPlan(userData.currentPlan, "sections")}
				type="sections"
			/>
		</>
	);
};

export default AddContentModal;
