"use client";
import { getDisplayItems } from "@/helpers/catalogueItems";
import type { ItemsBlock } from "@quicktalog/common";
import "swiper/css";
import "swiper/css/pagination";
import BlockControls from "../cards/common/BlockControls";
import Items from "./common/Items";
import SectionHeader from "./common/SectionHeader";

interface ItemsSectionProps {
	block: ItemsBlock;
	slug: string;
	isExpanded: boolean;
	onToggle: (slug: string) => void;
	currency: string;
	locale?: string;
	theme?: string;
	mode: "edit" | "view";
	currentLayout: "variant_1" | "variant_2" | "variant_3" | "variant_4";
	onAddItem?: (blockIndex: number) => void;
	blockIndex: number;
	onDelete?: () => void;
	onDeleteItem?: (itemIndex: number) => void;
	onEdit?: () => void;
	onEditItem?: (itemIndex: number) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onMoveItemUp?: (itemIndex: number) => void;
	onMoveItemDown?: (itemIndex: number) => void;
	onUpdateBlock?: (data: Partial<ItemsBlock>) => void;
	query?: string;
}

/**
 * A section of items, with or without a heading. The heading is also the
 * collapse toggle, so a headless section is always open.
 */
const ItemsSection = ({
	block,
	blockIndex,
	currency,
	currentLayout,
	locale,
	isExpanded,
	mode,
	onAddItem,
	onDelete,
	onDeleteItem,
	onEdit,
	onEditItem,
	onToggle,
	slug,
	theme,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	onMoveItemUp,
	onMoveItemDown,
	onUpdateBlock,
	query,
}: ItemsSectionProps) => {
	if (!block) return null;

	const code = `${slug}-${block.order}`;
	const contentId = `section-content-${code}`;
	const showHeading = block.showHeading;

	if (!Array.isArray(block.items) && mode !== "edit") {
		return (
			<section className="mb-5" id={code}>
				{showHeading && (
					<SectionHeader
						code={code}
						isExpanded={isExpanded}
						mode={mode}
						onToggle={onToggle}
						title={block.name}
					/>
				)}
				<div
					aria-live="polite"
					className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
					role="alert"
				>
					<p className="text-red-700 text-sm">Invalid data for this section</p>
				</div>
			</section>
		);
	}

	const showContent = showHeading ? mode === "edit" || isExpanded : true;
	const displayItems = getDisplayItems(block, query ?? "");

	return (
		<section
			className={`mb-5 ${
				!showHeading && mode === "edit"
					? "relative group/container border-2 border-dashed border-[var(--catalogue-text)]/20 rounded-lg p-4 transition-all"
					: ""
			}`}
			id={code}
		>
			{showHeading ? (
				<SectionHeader
					code={code}
					contentId={contentId}
					currentLayout={currentLayout}
					isExpanded={isExpanded}
					isFirst={isFirst}
					isLast={isLast}
					mode={mode}
					onDelete={onDelete}
					onEdit={onEdit}
					onLayoutChange={(layout) =>
						onUpdateBlock?.({ layout: layout as ItemsBlock["layout"] })
					}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
					onToggle={onToggle}
					title={block.name}
				/>
			) : (
				mode === "edit" && (
					<BlockControls
						currentLayout={currentLayout}
						isFirst={isFirst}
						isLast={isLast}
						onDelete={onDelete}
						onEdit={onEdit}
						onLayoutChange={(layout) =>
							onUpdateBlock?.({ layout: layout as ItemsBlock["layout"] })
						}
						onMoveDown={onMoveDown}
						onMoveUp={onMoveUp}
					/>
				)
			)}

			<Items
				block={block}
				blockIndex={blockIndex}
				contentId={contentId}
				currency={currency}
				currentLayout={currentLayout}
				displayItems={displayItems}
				locale={locale}
				mode={mode}
				onAddItem={onAddItem}
				onDeleteItem={onDeleteItem}
				onEditItem={onEditItem}
				onMoveItemDown={onMoveItemDown}
				onMoveItemUp={onMoveItemUp}
				showContent={showContent}
				theme={theme}
			/>
		</section>
	);
};

export default ItemsSection;
