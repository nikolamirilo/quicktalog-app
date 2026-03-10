"use client";
import UpgradePlanCTA from "@/components/general/UpgradePlanCTA";
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
import RichTextEditor from "../blocks/common/RichTextEditor";
import ContentInput from "../inputs/ContentInput";
import CustomCodeInput from "../inputs/CustomCodeInput";
import DividerInput from "../inputs/DividerInput";
import EmbeddingInput from "../inputs/EmbeddingInput";

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
	const [blockData, setBlockData] = useState({
		name: "",
		layout: "variant_1",
		src: "",
		items: [],
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
	});

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
				setBlockData({
					name: "",
					layout: "variant_1",
					src: "",
					items: [],
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
				});
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
		// Check blocks limit
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
				return "items"; // Utilizing 'items' type for LimitsModal as generic 'limit reached', or we might need a 'blocks' type if added
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
				<AlertDialogContent className="w-[95vw] md:max-w-5xl p-0 overflow-hidden bg-product-background rounded-2xl border-none shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[600px] lg:h-[650px] font-body text-product-foreground">
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
					<div className="flex-1 flex flex-col min-w-0 px-4 ">
						{/* Header */}
						<div className="py-2 border-gray-100 flex justify-between items-start">
							<div>
								<h3 className="text-lg font-semibold text-product-foreground capitalize">
									{selectedOption.split("_").join(" ")}
								</h3>
								<p className="text-sm text-gray-700 mt-1">
									{selectedOption === "container" &&
										"A layout block that holds multiple items in a single structured section."}

									{selectedOption === "category" &&
										"A collapsible section used to group related items under one heading."}

									{selectedOption === "embedding" &&
										"Embed external content such as maps, videos, or third-party widgets."}

									{selectedOption === "custom_code" &&
										"Insert custom HTML to add advanced or custom functionality."}

									{selectedOption === "text" &&
										"Add rich text content with headings, lists, links, and formatting."}

									{selectedOption === "divider" &&
										"Add a visual separator with customizable spacing and border styles."}
								</p>
							</div>
							<Button
								className="hidden md:inline-flex text-gray-400 hover:text-product-primary rounded-full hover:bg-gray-100"
								onClick={onClose}
								size="icon"
								variant="ghost"
							>
								<X className="w-5 h-5" />
							</Button>
						</div>
						<div className="mx-auto w-full border-t border-gray-300/70" />
						<div className="flex-1 overflow-y-auto mt-4 px-1 pb-8 flex flex-col">
							<div className="max-w-2xl w-full">
								{locked ? (
									<UpgradePlanCTA
										ctaLabel="Upgrade"
										href="/pricing"
										size="small"
										subtitle={
											selectedOption === "divider"
												? "Upgrade your plan to unlock Divider blocks for better content separation."
												: selectedOption === "embedding"
													? "Embed capabilities like maps and videos are available in higher tiers."
													: selectedOption === "custom_code"
														? "Custom HTML integration requires the Growth plan or higher."
														: "Upgrade your plan to access this feature."
										}
										title="Upgrade your plan"
									/>
								) : (
									<>
										{selectedOption === "category" && (
											<ContentInput
												onChange={(val) =>
													setBlockData({ ...blockData, ...val })
												}
												type="category"
												value={blockData}
											/>
										)}

										{selectedOption === "container" && (
											<ContentInput
												onChange={(val) =>
													setBlockData({ ...blockData, ...val })
												}
												type="container"
												value={blockData}
											/>
										)}

										{selectedOption === "embedding" && (
											<EmbeddingInput
												onChange={(val) =>
													setBlockData({ ...blockData, ...val })
												}
												value={blockData}
											/>
										)}

										{selectedOption === "custom_code" && (
											<CustomCodeInput
												onChange={(val) =>
													setBlockData({ ...blockData, ...val })
												}
												value={blockData}
												userData={userData}
											/>
										)}

										{selectedOption === "text" && (
											<div>
												<label className="block text-sm font-medium mb-2 text-gray-700">
													Content
												</label>
												<RichTextEditor
													className="px-0.5"
													content={blockData.content || "<p></p>"}
													onChange={(val) =>
														setBlockData({ ...blockData, content: val })
													}
												/>
											</div>
										)}

										{selectedOption === "divider" && (
											<DividerInput
												value={blockData.divider as any}
												onChange={(val) =>
													setBlockData({
														...blockData,
														divider: { ...blockData.divider, ...val } as any,
													})
												}
											/>
										)}
									</>
								)}
							</div>
						</div>

						{/* Footer Actions */}
						<div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
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
