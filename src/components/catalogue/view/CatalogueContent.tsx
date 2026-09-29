"use client";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useMainContext } from "@/context/MainContext";
import {
	ContentBlock,
	ContentLayout,
	Item,
	UserData,
} from "@quicktalog/common";
import {
	SEARCH_MIN_ITEMS,
	getDisplayItems,
	getTotalItemCount,
} from "@/lib/catalogue/items";
import { asItemsBlock, isItemsBlock } from "@/lib/catalogue/content-blocks";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiFileMinus } from "react-icons/fi";
import ItemModal from "@/components/catalogue/modals/ItemModal";
import CustomCodeBlockComponent from "@/components/catalogue/sections/CustomCode";
import DividerBlockComponent from "@/components/catalogue/sections/DividerBlock";
import EmbeddingBlockComponent from "@/components/catalogue/sections/EmbeddingBlock";
import ItemsSection from "@/components/catalogue/sections/ItemsSection";
import TextBlockComponent from "@/components/catalogue/sections/TextBlock";
import CatalogueSearchBar from "./CatalogueSearchBar";

export type CatalogueContentProps = {
	data: ContentBlock[];
	currency: string;
	/** BCP-47 tag derived from `catalogue.language`, for price formatting. */
	locale?: string;
	type: "demo" | "item";
	theme?: string;
	mode: "edit" | "view";
	onEditBlock?: (index: number) => void;
};

const CatalogueContent = ({
	data,
	currency,
	locale,
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
	const [rawQuery, setQuery] = useState<string>(
		() => searchParams.get("q") ?? "",
	);
	// Short catalogues are easy enough to scan, so search stays out of the way.
	const canSearch =
		mode === "view" && getTotalItemCount(data) > SEARCH_MIN_ITEMS;
	const query = canSearch ? rawQuery : "";
	const isSearching = query.trim().length > 0;

	const handleQueryChange = (next: string) => {
		setQuery(next);
		const params = new URLSearchParams(Array.from(searchParams.entries()));
		if (next.trim()) params.set("q", next);
		else params.delete("q");
		const qs = params.toString();
		router.replace(qs ? `?${qs}` : pathname, { scroll: false });
	};

	const urlQuery = searchParams.get("q") ?? "";
	useEffect(() => {
		// Sync from the URL (back/forward) keyed on the query string itself, not
		// the searchParams object (new identity every render). Returning `prev`
		// unchanged makes React bail out, which prevents an update loop.
		setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
	}, [urlQuery]);

	useEffect(() => {
		if (!data || data.length === 0) return;
		const initialExpanded = data.reduce(
			(acc, item, idx) => {
				const itemsBlock = asItemsBlock(item);
				const isExpanded =
					type === "demo"
						? idx === 0
						: itemsBlock?.showHeading
							? itemsBlock.isExpanded
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
			isItemsBlock(targetBlock) &&
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

		return getTotalItemCount(data) >= limit;
	};

	const openAddItemModal = (index: number) => {
		if (checkItemLimits()) {
			setShowLimitsModal(true);
			return;
		}

		const targetBlock = data[index];
		if (isItemsBlock(targetBlock)) {
			setActiveBlockLayout(targetBlock.layout);
		}
		setActiveCategoryIndex(index);
		setActiveEditingItem(null);
		setIsItemModalOpen(true);
	};

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
			{canSearch && (
				<CatalogueSearchBar onChange={handleQueryChange} value={query} />
			)}
			{data.map((block, index) => {
				const isExpanded = expandedSections[`${block.id}-${block.order}`];

				const handleDeleteClick = () => {
					if (removeBlock) {
						removeBlock(index);
					}
				};

				const itemsBlock = asItemsBlock(block);
				if (itemsBlock) {
					if (isSearching && getDisplayItems(itemsBlock, query).length === 0) {
						return null;
					}
					const currentLayout =
						type === "demo" ? (layout as ContentLayout) : itemsBlock.layout;
					return (
						<ItemsSection
							block={itemsBlock}
							blockIndex={index}
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={isSearching ? true : isExpanded}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							locale={locale}
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
								isSearching || !moveItem
									? undefined
									: (itemIndex) => moveItem(index, itemIndex, "down")
							}
							onMoveItemUp={
								isSearching || !moveItem
									? undefined
									: (itemIndex) => moveItem(index, itemIndex, "up")
							}
							onMoveUp={moveBlock ? () => moveBlock(index, "up") : undefined}
							onToggle={handleToggleSection}
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
					if (!isItemsBlock(block)) return true;
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
				categoryName={
					activeCategoryIndex !== null
						? ((data[activeCategoryIndex] as any)?.name ?? undefined)
						: undefined
				}
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
