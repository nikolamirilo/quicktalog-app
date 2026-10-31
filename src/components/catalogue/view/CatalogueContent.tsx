"use client";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useMainContext } from "@/context/MainContext";
import type {
	Appearance,
	ContentBlock,
	ContentLayout,
	Item,
	UserData,
} from "@quicktalog/common";
import { getDisplayItems } from "@/lib/catalogue/items";
import {
	asItemsBlock,
	isItemsBlock,
	normalizeContent,
} from "@/lib/catalogue/content-blocks";
import { canAddItem } from "@/lib/entitlements/operation-limits";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiFileMinus } from "react-icons/fi";
import ItemModal from "@/components/catalogue/modals/ItemModal";
import CustomVisualBlockComponent from "@/components/catalogue/sections/CustomVisual";
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
	onEditBlock?: (blockId: string) => void;
	/** The owner's search bar setting; no bar when missing or off. */
	search?: NonNullable<Appearance["search"]>;
};

const CatalogueContent = ({
	data: rawData,
	currency,
	locale,
	type,
	theme,
	mode,
	onEditBlock,
	search,
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
	/**
	 * Legacy keys are mapped here, once, before anything matches on
	 * `block.type`. Without this a stored `category` or `container` row hits
	 * no branch and renders nothing - the row is intact, the page is just
	 * blank, which is the worst way for a rename to fail.
	 *
	 * Order and length are preserved, so the indices the edit callbacks pass to
	 * `removeBlock`/`moveBlock`/`updateBlock` still address the right block in
	 * the unnormalized draft those callbacks mutate.
	 */
	const data = useMemo(() => normalizeContent(rawData), [rawData]);
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	// Ids, not positions: the agent's edits land on the draft while this dialog
	// is open, so a position read when it opened can point at another section.
	const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
	const [activeBlockLayout, setActiveBlockLayout] =
		useState<ContentLayout | null>(null);
	const [activeEditingItem, setActiveEditingItem] = useState<{
		itemId: string;
		item: Item;
	} | null>(null);

	const [isItemModalOpen, setIsItemModalOpen] = useState(false);
	const [showLimitsModal, setShowLimitsModal] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [rawQuery, setQuery] = useState<string>(() =>
		mode === "view" ? (searchParams.get("q") ?? "") : "",
	);
	const canSearch = search?.isEnabled === true;
	const query = canSearch ? rawQuery : "";
	const isSearching = query.trim().length > 0;
	const matchCount = useMemo(
		() =>
			isSearching
				? data.reduce(
						(total, block) =>
							isItemsBlock(block)
								? total + getDisplayItems(block, query).length
								: total,
						0,
					)
				: 0,
		[data, query, isSearching],
	);

	const handleQueryChange = (next: string) => {
		setQuery(next);
		// The builder keeps its own URL; only the published page shares `?q=`.
		if (mode !== "view") return;
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
		if (mode !== "view") return;
		setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
	}, [urlQuery, mode]);

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

	/** The item a card's control points at, resolved while that card is on screen. */
	const itemAt = (block: ContentBlock, itemIndex: number): Item | undefined =>
		asItemsBlock(block)?.items?.[itemIndex];

	const handleDeleteItem = (block: ContentBlock, itemIndex: number) => {
		const item = itemAt(block, itemIndex);
		if (item) removeItem?.(block.id, item.id);
	};

	const handleMoveItem = (
		block: ContentBlock,
		itemIndex: number,
		direction: "up" | "down",
	) => {
		const item = itemAt(block, itemIndex);
		if (item) moveItem?.(block.id, item.id, direction);
	};

	const closeItemModal = () => {
		setIsItemModalOpen(false);
		setActiveBlockId(null);
		setActiveEditingItem(null);
		setActiveBlockLayout(null);
	};

	const handleEditItem = (block: ContentBlock, itemIndex: number) => {
		const itemsBlock = asItemsBlock(block);
		const item = itemAt(block, itemIndex);
		if (!itemsBlock || !item) return;
		setActiveBlockId(block.id);
		setActiveBlockLayout(itemsBlock.layout);
		setActiveEditingItem({ itemId: item.id, item });
		setIsItemModalOpen(true);
	};

	const handleSaveItem = (newItem: Item, addAnother: boolean) => {
		if (!activeBlockId) return;
		if (activeEditingItem) {
			updateItem?.(activeBlockId, activeEditingItem.itemId, newItem);
			closeItemModal();
			return;
		}

		// "Add another" keeps the modal open, so the limit is checked on every add.
		if (checkItemLimits()) {
			closeItemModal();
			setShowLimitsModal(true);
			return;
		}

		addItem?.(activeBlockId, newItem);
		if (!addAnother) closeItemModal();
	};

	const checkItemLimits = () =>
		!canAddItem(data, userData?.currentPlan?.features.items_per_catalogue);

	const openAddItemModal = (block: ContentBlock) => {
		if (checkItemLimits()) {
			setShowLimitsModal(true);
			return;
		}

		setActiveBlockLayout(asItemsBlock(block)?.layout ?? null);
		setActiveBlockId(block.id);
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
				<CatalogueSearchBar
					matchCount={matchCount}
					onChange={handleQueryChange}
					placeholder={search?.placeholder}
					value={query}
				/>
			)}
			{data.map((block, index) => {
				const isExpanded = expandedSections[`${block.id}-${block.order}`];

				const handleDeleteClick = () => removeBlock?.(block.id);

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
							currency={currency}
							currentLayout={currentLayout}
							isExpanded={isSearching ? true : isExpanded}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							locale={locale}
							mode={mode}
							onAddItem={
								isSearching ? undefined : () => openAddItemModal(block)
							}
							onDelete={handleDeleteClick}
							onDeleteItem={
								isSearching
									? undefined
									: (itemIndex) => handleDeleteItem(block, itemIndex)
							}
							onEdit={onEditBlock ? () => onEditBlock(block.id) : undefined}
							onEditItem={
								isSearching
									? undefined
									: (itemIndex) => handleEditItem(block, itemIndex)
							}
							onMoveDown={
								moveBlock ? () => moveBlock(block.id, "down") : undefined
							}
							onMoveItemDown={
								isSearching || !moveItem
									? undefined
									: (itemIndex) => handleMoveItem(block, itemIndex, "down")
							}
							onMoveItemUp={
								isSearching || !moveItem
									? undefined
									: (itemIndex) => handleMoveItem(block, itemIndex, "up")
							}
							onMoveUp={moveBlock ? () => moveBlock(block.id, "up") : undefined}
							onToggle={handleToggleSection}
							onUpdateBlock={
								updateBlock ? (data) => updateBlock(block.id, data) : undefined
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
							onEdit={onEditBlock ? () => onEditBlock(block.id) : undefined}
							onMoveDown={() => moveBlock(block.id, "down")}
							onMoveUp={() => moveBlock(block.id, "up")}
							slug={block.id}
						/>
					);
				} else if (block.type === "custom_visual") {
					return (
						<CustomVisualBlockComponent
							block={block}
							isFirst={index === 0}
							isLast={index === data.length - 1}
							key={`${block.id}-${block.order}`}
							mode={mode}
							onDelete={handleDeleteClick}
							onEdit={onEditBlock ? () => onEditBlock(block.id) : undefined}
							onMoveDown={() => moveBlock(block.id, "down")}
							onMoveUp={() => moveBlock(block.id, "up")}
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
							onMoveDown={() => moveBlock(block.id, "down")}
							onMoveUp={() => moveBlock(block.id, "up")}
							onUpdateBlock={
								updateBlock
									? (newData) => updateBlock(block.id, newData)
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
							onMoveDown={() => moveBlock(block.id, "down")}
							onMoveUp={() => moveBlock(block.id, "up")}
							onUpdateBlock={
								updateBlock
									? (newData) => updateBlock(block.id, newData)
									: undefined
							}
							slug={block.id}
						/>
					);
				}
				return null;
			})}

			<ItemModal
				categoryName={
					data.find((block) => block.id === activeBlockId)?.name ?? undefined
				}
				checkItemLimits={checkItemLimits}
				currency={currency}
				initialItem={activeEditingItem ? activeEditingItem.item : undefined}
				isOpen={isItemModalOpen}
				layout={activeBlockLayout}
				onClose={closeItemModal}
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
