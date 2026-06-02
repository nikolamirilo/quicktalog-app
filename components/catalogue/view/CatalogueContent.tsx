"use client";
import LimitsModal from "@/components/modals/LimitsModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useMainContext } from "@/context/MainContext";
import { CatalogueContentProps } from "@/types/shared";
import { ContentLayout, Item, UserData } from "@quicktalog/common";
import { getDisplayItems } from "@/helpers/catalogueItems";
import { getRequiredPlan } from "@/helpers/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiFileMinus } from "react-icons/fi";
import ItemModal from "../modals/ItemModal";
import CategoryBlockComponent from "../sections/CategoryBlock";
import ContainerBlockComponent from "../sections/ContainerBlock";
import CustomCodeBlockComponent from "../sections/CustomCode";
import DividerBlockComponent from "../sections/DividerBlock";
import EmbeddingBlockComponent from "../sections/EmbeddingBlock";
import TextBlockComponent from "../sections/TextBlock";
import CatalogueSearchBar from "./CatalogueSearchBar";

const CatalogueContent = ({
	data,
	currency,
	type,
	theme,
	mode,
	onEditBlock,
	userData,
}: CatalogueContentProps & { userData?: UserData }) => {
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
	const [showLimitsModal, setShowLimitsModal] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [query, setQuery] = useState<string>(() => searchParams.get("q") ?? "");
	const isSearching = query.trim().length > 0;

	const handleQueryChange = (next: string) => {
		setQuery(next);
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		if (next.trim()) params.set("q", next);
		else params.delete("q");
		const qs = params.toString();
		router.replace(qs ? `?${qs}` : pathname, { scroll: false });
	};

	useEffect(() => {
		const urlQuery = searchParams.get("q") ?? "";
		if (urlQuery !== query) {
			setQuery(urlQuery);
		}
	}, [searchParams]);

	useEffect(() => {
		if (!data || data.length === 0) return;
		const initialExpanded = data.reduce(
			(acc, item, idx) => {
				const isExpanded =
					type === "demo"
						? idx === 0
						: item.type === "category"
							? ((item as any).isExpanded ?? true)
							: true;

				acc[`${item.id}-${item.order}`] = isExpanded;
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

	const checkItemLimits = () => {
		if (!userData || !userData.currentPlan) return false;

		const limit = userData.currentPlan.features.items_per_catalogue;
		if (limit === "unlimited") return false;
		if (limit === undefined) return false;

		let totalItems = 0;
		data.forEach((block) => {
			if (block.type === "category" || block.type === "container") {
				const b = block as any;
				if (b.items) {
					totalItems += b.items.length;
				}
			}
		});

		return totalItems >= limit;
	};

	const openAddItemModal = (index: number) => {
		if (checkItemLimits()) {
			setShowLimitsModal(true);
			return;
		}

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
					className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-8 py-20 text-center"
					role="status"
				>
					<div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
						<FiFileMinus size={40} />
					</div>

					{/* Text */}
					<h2 className="text-xl font-semibold text-gray-800">
						Nothing here yet
					</h2>
					<p className="mt-1.5 text-lg text-gray-500 max-w-lg">
						Content you add will appear here. Get started by adding your first
						item.
					</p>
				</div>
			</main>
		);
	}

	return (
		<main aria-label="Categories and items" className="max-w-6xl mx-auto px-4">
			{mode === "view" && (
				<CatalogueSearchBar onChange={handleQueryChange} value={query} />
			)}
			{data.map((block, index) => {
				const isExpanded = expandedSections[`${block.id}-${block.order}`];

				const handleDeleteClick = () => {
					if (removeBlock) {
						removeBlock(index);
					}
				};

				if (block.type === "category") {
					const categoryDisplayItems = getDisplayItems(block, query);
					if (isSearching && categoryDisplayItems.length === 0) return null;
					const forceExpanded = isSearching ? true : isExpanded;
					const currentLayout =
						type === "demo" ? (layout as ContentLayout) : block.layout;
					return (
						<CategoryBlockComponent
							block={block}
							blockIndex={index}
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={forceExpanded}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onAddItem={isSearching ? undefined : openAddItemModal}
							onDelete={handleDeleteClick}
							onDeleteItem={
								isSearching
									? undefined
									: (itemIndex) => handleDeleteItem(index, itemIndex)
							}
							onEdit={onEditBlock ? () => onEditBlock(index) : undefined}
							onEditItem={
								isSearching
									? undefined
									: (itemIndex) => handleEditItem(index, itemIndex)
							}
							onMoveDown={() => moveBlock(index, "down")}
							onMoveItemDown={
								isSearching
									? undefined
									: (itemIndex) => moveItem(index, itemIndex, "down")
							}
							onMoveItemUp={
								isSearching
									? undefined
									: (itemIndex) => moveItem(index, itemIndex, "up")
							}
							onMoveUp={() => moveBlock(index, "up")}
							onToggle={handleToggleSection}
							onUpdateBlock={
								updateBlock ? (data) => updateBlock(index, data) : undefined
							}
							query={query}
							slug={block.id}
							theme={theme}
						/>
					);
				} else if (block.type === "container") {
					const containerDisplayItems = getDisplayItems(block, query);
					if (isSearching && containerDisplayItems.length === 0) return null;
					const currentLayout =
						type === "demo" ? (layout as ContentLayout) : block.layout;
					return (
						<ContainerBlockComponent
							block={block}
							blockIndex={index}
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={isExpanded}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onAddItem={isSearching ? undefined : openAddItemModal}
							onDelete={handleDeleteClick}
							onDeleteItem={
								isSearching
									? undefined
									: (itemIndex) => handleDeleteItem(index, itemIndex)
							}
							onEdit={onEditBlock ? () => onEditBlock(index) : undefined}
							onEditItem={
								isSearching
									? undefined
									: (itemIndex) => handleEditItem(index, itemIndex)
							}
							onMoveDown={
								moveBlock ? () => moveBlock(index, "down") : undefined
							}
							onMoveItemDown={
								isSearching
									? undefined
									: moveItem
										? (itemIndex) => moveItem(index, itemIndex, "down")
										: undefined
							}
							onMoveItemUp={
								isSearching
									? undefined
									: moveItem
										? (itemIndex) => moveItem(index, itemIndex, "up")
										: undefined
							}
							onMoveUp={moveBlock ? () => moveBlock(index, "up") : undefined}
							onUpdateBlock={
								updateBlock ? (data) => updateBlock(index, data) : undefined
							}
							query={query}
							slug={block.id}
							theme={theme}
						/>
					);
				} else if (block.type === "embedding") {
					return (
						<EmbeddingBlockComponent
							block={block}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onDelete={handleDeleteClick}
							onEdit={onEditBlock ? () => onEditBlock(index) : undefined}
							onMoveDown={() => moveBlock(index, "down")}
							onMoveUp={() => moveBlock(index, "up")}
							slug={block.id}
						/>
					);
				} else if (block.type === "custom_code") {
					return (
						<CustomCodeBlockComponent
							block={block}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onDelete={handleDeleteClick}
							onEdit={onEditBlock ? () => onEditBlock(index) : undefined}
							onMoveDown={() => moveBlock(index, "down")}
							onMoveUp={() => moveBlock(index, "up")}
							slug={block.id}
						/>
					);
				}
				if (block.type === "text") {
					return (
						<TextBlockComponent
							block={block}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onDelete={handleDeleteClick}
							onMoveDown={() => moveBlock(index, "down")}
							onMoveUp={() => moveBlock(index, "up")}
							onUpdateBlock={
								updateBlock
									? (newData) => updateBlock(index, newData)
									: undefined
							}
							slug={block.id}
						/>
					);
				}
				if (block.type === "divider") {
					return (
						<DividerBlockComponent
							block={block}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onDelete={handleDeleteClick}
							onMoveDown={() => moveBlock(index, "down")}
							onMoveUp={() => moveBlock(index, "up")}
							onUpdateBlock={
								updateBlock
									? (newData) => updateBlock(index, newData)
									: undefined
							}
							slug={block.id}
						/>
					);
				}
				return null;
			})}

			{isSearching &&
				data.every((block) => {
					if (block.type !== "category" && block.type !== "container")
						return true;
					return getDisplayItems(block, query).length === 0;
				}) && (
					<div
						aria-live="polite"
						className="text-center py-12 text-[var(--catalogue-text)]/70"
						role="status"
					>
						No items match "{query}".
					</div>
				)}

			<ItemModal
				checkItemLimits={checkItemLimits}
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
				onShowLimits={() => setShowLimitsModal(true)}
			/>
			<LimitsModal
				currentPlan={userData?.currentPlan}
				isOpen={showLimitsModal}
				onClose={() => setShowLimitsModal(false)}
				requiredPlan={
					userData ? getRequiredPlan(userData.currentPlan, "items") : undefined
				}
				type="items"
			/>
		</main>
	);
};

export default CatalogueContent;
