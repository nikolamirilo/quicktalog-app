"use client";
import { getDisplayItems } from "@/helpers/catalogueItems";
import type { CategoryBlock } from "@quicktalog/common";
import "swiper/css";
import "swiper/css/pagination";
import CategoryHeader from "./common/CategoryHeader";
import Items from "./common/Items";

interface CategoryBlockProps {
	block: CategoryBlock;
	slug: string;
	isExpanded: boolean;
	onToggle: (slug: string) => void;
	currency: string;
	theme?: string;
	mode: "edit" | "view";
	currentLayout: "variant_1" | "variant_2" | "variant_3" | "variant_4";
	onAddItem?: (blockIndex: number) => void;
	onPasteItems?: (blockIndex: number) => void;
	isGeneratingItems?: boolean;
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
	onUpdateBlock?: (data: Partial<CategoryBlock>) => void;
	query?: string;
}

const CategoryBlockComponent = ({
	block,
	blockIndex,
	currency,
	currentLayout,
	isExpanded,
	mode,
	onAddItem,
	onPasteItems,
	isGeneratingItems,
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
}: CategoryBlockProps) => {
	if (!block) return null;

	if (!block.items || !Array.isArray(block.items)) {
		if (mode !== "edit") {
			return (
				<section
					className="mb-5"
					id={`${slug}-${block.order}`}
					key={`${slug}-${block.order}`}
				>
					<CategoryHeader
						code={`${slug}-${block.order}`}
						isExpanded={isExpanded}
						mode={mode}
						onToggle={onToggle}
						title={block.name}
					/>

					<div
						aria-live="polite"
						className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
						role="alert"
					>
						<p className="text-red-700 text-sm">
							Invalid data for this {block.type}
						</p>
					</div>
				</section>
			);
		}
	}

	const showContent = mode === "edit" || isExpanded;

	const displayItems = getDisplayItems(block, query ?? "");

	return (
		<section
			className="mb-5"
			id={`${slug}-${block.order}`}
			key={`${slug}-${block.order}`}
		>
			<CategoryHeader
				code={`${slug}-${block.order}`}
				currentLayout={currentLayout}
				isExpanded={isExpanded}
				isFirst={isFirst}
				isLast={isLast}
				mode={mode}
				onDelete={onDelete}
				onEdit={onEdit}
				onLayoutChange={(layout) =>
					onUpdateBlock && onUpdateBlock({ layout: layout as any })
				}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
				onToggle={onToggle}
				title={block.name}
			/>

			<Items
				block={block}
				blockIndex={blockIndex}
				currency={currency}
				currentLayout={currentLayout}
				displayItems={displayItems}
				isGeneratingItems={isGeneratingItems}
				mode={mode}
				onAddItem={onAddItem}
				onDeleteItem={onDeleteItem}
				onEditItem={onEditItem}
				onMoveItemDown={onMoveItemDown}
				onMoveItemUp={onMoveItemUp}
				onPasteItems={onPasteItems}
				showContent={showContent}
				theme={theme}
			/>
		</section>
	);
};

export default CategoryBlockComponent;
