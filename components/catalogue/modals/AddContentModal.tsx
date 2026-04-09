"use client";
import LimitsModal from "@/components/modals/LimitsModal";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { snakeToTitleCase } from "@/helpers/client";
import { ContentBlock, tiers, UserData } from "@quicktalog/common";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ContentOptionsSelector } from "../blocks/common/ContentOptionsSelector";
import BlockConfigForm from "./content/BlockConfigForm";
import BlockConfigHeader from "./content/BlockConfigHeader";

interface AddContentModalProps {
	isOpen: boolean;
	onClose: () => void;
	setIsOpen: (open: boolean) => void;
	editingBlock?: ContentBlock | null;
	blockIndex?: number | null;
	userData: UserData;
}

type ContentOption =
	| "container"
	| "category"
	| "text"
	| "embedding"
	| "custom_code"
	| "divider";

const DEFAULT_BLOCK_DATA = {
	name: "",
	layout: "variant_1",
	src: "",
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
	isExpanded: true,
};

const AddContentModal = ({
	isOpen,
	onClose,
	setIsOpen,
	editingBlock,
	blockIndex,
	userData,
}: AddContentModalProps) => {
	const { catalogue, updateCatalogue, updateBlock, setIsSidebarOpen } =
		useCatalogueContext() || {};
	const [selectedOption, setSelectedOption] =
		useState<ContentOption>("container");
	const [showLimitsModal, setShowLimitsModal] = useState(false);
	const [blockData, setBlockData] = useState({ ...DEFAULT_BLOCK_DATA });

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
			if (editingBlock) {
				setSelectedOption(editingBlock.type as ContentOption);
				setBlockData({
					name: (editingBlock as any).name || "",
					layout: (editingBlock as any).layout || "variant_1",
					src: (editingBlock as any).src || "",
					items: (editingBlock as any).items || [],
					code: (editingBlock as any).code || "",
					content: (editingBlock as any).content || "",
					divider:
						editingBlock.type === "divider"
							? {
									spacing: (editingBlock as any).spacing,
									border: (editingBlock as any).border,
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
					isExpanded: (editingBlock as any).isExpanded ?? true,
				});
			} else {
				setSelectedOption("container");
				setBlockData({ ...DEFAULT_BLOCK_DATA });
			}
		}
	}, [isOpen, editingBlock]);

	const isLocked = (key: ContentOption) => {
		if (!userData?.currentPlan?.features?.blocks) return false;

		switch (key) {
			case "divider":
				return userData.currentPlan.features.blocks.divider === false;
			case "embedding":
				return userData.currentPlan.features.blocks.embedding === false;
			case "custom_code":
				return userData.currentPlan.features.blocks.customCode === false;
			default:
				return false;
		}
	};

	const checkLimits = () => {
		const blocksLimit = userData?.currentPlan?.features?.blocks_per_catalogue;

		if (selectedOption === "text") return null;

		if (
			blocksLimit !== "unlimited" &&
			blocksLimit !== undefined &&
			!editingBlock
		) {
			const nonTextBlocksCount = catalogue.content.filter(
				(block: any) => block.type !== "text",
			).length;
			if (nonTextBlocksCount >= blocksLimit) {
				return "items";
			}
		}
		return null;
	};

	const handleAdd = () => {
		if (!catalogue || !updateCatalogue) return;

		const limitReached = checkLimits();
		if (limitReached) {
			setShowLimitsModal(true);
			return;
		}

		let newBlock: any = {
			id: editingBlock?.id || crypto.randomUUID(),
			order: editingBlock?.order ?? catalogue.content.length,
			type: selectedOption,
		};

		if (selectedOption === "category") {
			newBlock = {
				...newBlock,
				name: blockData.name,
				layout: blockData.layout,
				items:
					editingBlock?.type === "category" ? (editingBlock as any).items : [],
				isExpanded: blockData.isExpanded,
			};
		} else if (selectedOption === "container") {
			newBlock = {
				...newBlock,
				name: blockData.name,
				layout: blockData.layout,
				items:
					editingBlock?.type === "container" ? (editingBlock as any).items : [],
			};
		} else if (selectedOption === "embedding") {
			newBlock = {
				...newBlock,
				code: blockData.code,
			};
		} else if (selectedOption === "custom_code") {
			newBlock = {
				...newBlock,
				code: blockData.code,
			};
		} else if (selectedOption === "text") {
			newBlock = {
				...newBlock,
				content: blockData.content || "<p>New text block</p>",
			};
		} else if (selectedOption === "divider") {
			newBlock = {
				...newBlock,
				spacing: blockData.divider.spacing,
				border: blockData.divider.border,
			};
		}

		if (blockIndex !== undefined && blockIndex !== null && updateBlock) {
			updateBlock(blockIndex, newBlock);
		} else {
			updateCatalogue({
				content: [...catalogue.content, newBlock],
			});
		}
		setIsOpen(false);
	};

	const isFormValid = () => {
		if (isLocked(selectedOption)) return false;
		if (selectedOption === "category" || selectedOption === "container")
			return (blockData.name?.trim().length ?? 0) > 0;
		if (selectedOption === "embedding")
			return (blockData.code?.trim().length ?? 0) > 0;
		if (selectedOption === "custom_code")
			return (blockData.code?.trim().length ?? 0) > 0;
		return true;
	};

	const locked = isLocked(selectedOption);

	return (
		<>
			<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
				<AlertDialogContent className="w-[98vw] sm:w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-product-background border-none shadow-2xl flex flex-col md:flex-row h-fit max-h-[90dvh] md:h-[600px] lg:h-[650px] font-body text-product-foreground">
					<div className="w-full md:w-1/4 bg-gray-200/50 border-b md:border-b-0 md:border-r border-gray-300 flex flex-col">
						<div className="p-6 pb-4 flex justify-between items-start">
							<div>
								<AlertDialogTitle className="text-xl text-product-foreground">
									{editingBlock ? "Edit section" : "Select section type"}
								</AlertDialogTitle>
								<p className="text-sm text-gray-500 mt-1"></p>
							</div>
							<Button
								className="md:hidden text-gray-400 hover:text-product-primary rounded-full hover:bg-gray-100 -mr-2 -mt-2"
								onClick={onClose}
								size="icon"
								variant="ghost"
							>
								<X className="w-5 h-5" />
							</Button>
						</div>
						<ContentOptionsSelector
							onSelect={setSelectedOption as any}
							selectedOption={selectedOption as any}
						/>
					</div>

					{/* Right Content - 3/4 width */}
					<div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto p-4 md:p-6">
						<BlockConfigHeader
							selectedOption={selectedOption}
							onClose={onClose}
						/>
						<div className="mx-auto w-full border-t border-gray-300/70" />
						<BlockConfigForm
							selectedOption={selectedOption}
							blockData={blockData}
							setBlockData={setBlockData}
							locked={locked}
							userData={userData}
						/>

						{/* Footer Actions */}
						<div className="p-3 sm:p-6 border-t border-gray-100 flex justify-end gap-3 bg-white flex-shrink-0">
							<Button
								className="hover:text-product-primary hover:border-product-primary"
								onClick={onClose}
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								className="bg-product-primary text-secondary hover:bg-product-primary/90 disabled:opacity-50"
								disabled={!isFormValid()}
								onClick={handleAdd}
							>
								{editingBlock ? "Update" : "Add"}{" "}
								{snakeToTitleCase(selectedOption)}
							</Button>
						</div>
					</div>
				</AlertDialogContent>
			</AlertDialog>

			<LimitsModal
				isOpen={showLimitsModal}
				onClose={() => setShowLimitsModal(false)}
				currentPlan={userData?.currentPlan}
				requiredPlan={userData?.nextPlan || tiers[tiers.length - 1]}
				type="items"
			/>
		</>
	);
};

export default AddContentModal;
