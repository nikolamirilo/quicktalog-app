"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useMainContext } from "@/context/MainContext";
import { ContentLayout, Item } from "@/types/catalogue";
import { CatalogueContentProps } from "@/types/components";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CategoryBlockComponent from "../blocks/CategoryBlock";
import ContainerBlockComponent from "../blocks/ContainerBlock";
import CustomCode from "../blocks/CustomCode";
import IframeBlockComponent from "../blocks/IframeBlock";
import TextBlockComponent from "../blocks/TextBlock";
import ItemModal from "../modals/ItemModal";

const CatalogueContent = ({
	data,
	currency,
	type,
	theme,
	mode,
}: CatalogueContentProps) => {
	const {
		addItem,
		removeItem,
		removeBlock,
		updateItem,
		moveBlock,
		moveItem,
		updateBlock,
	} = useCatalogueContext() || {};
	const { layout } = useMainContext();
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
		null,
	);
	const [activeBlockLayout, setActiveBlockLayout] =
		useState<ContentLayout | null>(null);
	const [activeEditingItem, setActiveEditingItem] = useState<{
		categoryIndex: number;
		itemIndex: number;
		item: Item;
	} | null>(null);

	const [isItemModalOpen, setIsItemModalOpen] = useState(false);
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!data || data.length === 0) return;
		const initialExpanded = data.reduce(
			(acc, item, idx) => {
				acc[`${item.id}-${item.order}`] = type === "demo" || idx === 0;
				return acc;
			},
			{} as Record<string, boolean>,
		);
		setExpandedSections(initialExpanded);
	}, [data, type]);

	const handleToggleSection = (slug: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[slug]: !prev[slug],
		}));
	};

	const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
		if (removeItem) {
			removeItem(categoryIndex, itemIndex);
		}
	};

	const handleEditItem = (categoryIndex: number, itemIndex: number) => {
		const targetBlock = data[categoryIndex];
		if (
			(targetBlock.type === "category" || targetBlock.type === "container") &&
			targetBlock.items &&
			targetBlock.items[itemIndex]
		) {
			setActiveCategoryIndex(categoryIndex);
			setActiveBlockLayout(targetBlock.layout);
			setActiveEditingItem({
				categoryIndex,
				itemIndex,
				item: targetBlock.items[itemIndex],
			});
			setIsItemModalOpen(true);
		}
	};

	const handleSaveItem = (newItem: Item, addAnother: boolean) => {
		if (activeCategoryIndex === null) return;
		if (activeEditingItem) {
			if (updateItem) {
				updateItem(activeCategoryIndex, activeEditingItem.itemIndex, newItem);
				setIsItemModalOpen(false);
				setActiveEditingItem(null);
				setActiveCategoryIndex(null);
			}
			return;
		}

		if (addItem) {
			addItem(activeCategoryIndex, newItem);
		}

		if (!addAnother) {
			setIsItemModalOpen(false);
			setActiveCategoryIndex(null);
		}
	};

	const openAddItemModal = (index: number) => {
		const targetBlock = data[index];
		if (targetBlock.type === "category" || targetBlock.type === "container") {
			setActiveBlockLayout(targetBlock.layout);
		}
		setActiveCategoryIndex(index);
		setActiveEditingItem(null);
		setIsItemModalOpen(true);
	};

	useEffect(() => {
		const isExpanded = searchParams.get("expanded");
		console.log("isExpanded from URL:", isExpanded);

		if (isExpanded && data && data.length > 0) {
			const allSectionsExpanded = data.reduce(
				(acc, item) => {
					acc[`${item.id}-${item.order}`] = true;
					return acc;
				},
				{} as Record<string, boolean>,
			);

			setExpandedSections(allSectionsExpanded);
		}
	}, [searchParams, data]);

	if ((!data || !Array.isArray(data) || data.length === 0) && mode === "view") {
		console.warn("No data, rendering null");
		return (
			<main
				aria-label="Services content"
				className="max-w-6xl mx-auto px-4 py-4"
			>
				<div
					aria-live="polite"
					className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
					role="alert"
				>
					<h2 className="text-lg font-semibold text-yellow-800 mb-2">
						No Data Available
					</h2>
					<p className="text-yellow-700">No data has been loaded yet.</p>
				</div>
			</main>
		);
	}

	return (
		<main
			aria-label="Categories and items"
			className="max-w-6xl mx-auto py-5 px-4"
		>
			{data.map((block, index) => {
				const isExpanded = expandedSections[`${block.id}-${block.order}`];

				const handleDeleteClick = () => {
					if (removeBlock) {
						removeBlock(index);
					}
				};

				if (block.type === "category") {
					const currentLayout =
						type === "demo" ? (layout as ContentLayout) : block.layout;
					return (
						<CategoryBlockComponent
							block={block}
							blockIndex={index}
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={isExpanded}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onAddItem={openAddItemModal}
							onDelete={handleDeleteClick}
							onDeleteItem={(itemIndex) => handleDeleteItem(index, itemIndex)}
							onEditItem={(itemIndex) => handleEditItem(index, itemIndex)}
							onToggle={handleToggleSection}
							slug={block.id}
							theme={theme}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							onMoveItemUp={(itemIndex) => moveItem(index, itemIndex, "up")}
							onMoveItemDown={(itemIndex) => moveItem(index, itemIndex, "down")}
							onUpdateBlock={
								updateBlock ? (data) => updateBlock(index, data) : undefined
							}
						/>
					);
				} else if (block.type === "container") {
					const currentLayout =
						type === "demo" ? (layout as ContentLayout) : block.layout;
					return (
						<ContainerBlockComponent
							block={block}
							blockIndex={index}
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={isExpanded}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onAddItem={openAddItemModal}
							onDelete={handleDeleteClick}
							onDeleteItem={(itemIndex) => handleDeleteItem(index, itemIndex)}
							onEditItem={(itemIndex) => handleEditItem(index, itemIndex)}
							slug={block.id}
							theme={theme}
							onMoveUp={moveBlock ? () => moveBlock(index, "up") : undefined}
							onMoveDown={
								moveBlock ? () => moveBlock(index, "down") : undefined
							}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							onMoveItemUp={
								moveItem
									? (itemIndex) => moveItem(index, itemIndex, "up")
									: undefined
							}
							onMoveItemDown={
								moveItem
									? (itemIndex) => moveItem(index, itemIndex, "down")
									: undefined
							}
							onUpdateBlock={
								updateBlock ? (data) => updateBlock(index, data) : undefined
							}
						/>
					);
				} else if (block.type === "iframe") {
					return (
						<IframeBlockComponent
							mode={mode}
							block={block}
							key={`${block.id}-${block.order}`}
							onDelete={handleDeleteClick}
							slug={block.id}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							isFirst={index === 0}
							isLast={index === data.length - 1}
						/>
					);
				} else if (block.type === "custom_code") {
					return (
						<CustomCode
							mode={mode}
							block={block}
							key={`${block.id}-${block.order}`}
							onDelete={handleDeleteClick}
							slug={block.id}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							isFirst={index === 0}
							isLast={index === data.length - 1}
						/>
					);
				}
				if (block.type === "text") {
					return (
						<TextBlockComponent
							mode={mode}
							block={block}
							key={`${block.id}-${block.order}`}
							onDelete={handleDeleteClick}
							slug={block.id}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							onUpdateBlock={
								updateBlock ? (newData) => updateBlock(index, newData) : undefined
							}
						/>
					);
				}
				return null;
			})}

			<ItemModal
				currency={currency}
				initialItem={activeEditingItem ? activeEditingItem.item : undefined}
				isOpen={isItemModalOpen}
				layout={activeBlockLayout}
				onClose={() => {
					setIsItemModalOpen(false);
					setActiveCategoryIndex(null);
					setActiveEditingItem(null);
					setActiveBlockLayout(null);
				}}
				onSave={handleSaveItem}
			/>
		</main>
	);
};

export default CatalogueContent;
