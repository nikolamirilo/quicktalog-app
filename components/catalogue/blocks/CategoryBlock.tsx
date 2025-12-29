"use client";
import type { CategoryBlock } from "@/types/catalogue";
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
	blockIndex: number;
	onDelete?: () => void;
	onDeleteItem?: (itemIndex: number) => void;
	onEditItem?: (itemIndex: number) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onMoveItemUp?: (itemIndex: number) => void;
	onMoveItemDown?: (itemIndex: number) => void;
	onUpdateBlock?: (data: Partial<CategoryBlock>) => void;
}

const CategoryBlockComponent = ({
	block,
	blockIndex,
	currency,
	currentLayout,
	isExpanded,
	mode,
	onAddItem,
	onDelete,
	onDeleteItem,
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
						onToggle={onToggle}
						title={block.name}
						mode={mode}
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
				onDelete={onDelete}
				onToggle={onToggle}
				title={block.name}
				onMoveUp={onMoveUp}
				onMoveDown={onMoveDown}
				isFirst={isFirst}
				isLast={isLast}
				currentLayout={currentLayout}
				onLayoutChange={(layout) =>
					onUpdateBlock && onUpdateBlock({ layout: layout as any })
				}
			/>

			<Items
				block={block}
				blockIndex={blockIndex}
				currentLayout={currentLayout}
				currency={currency}
				mode={mode}
				showContent={showContent}
				theme={theme}
				onAddItem={onAddItem}
				onDeleteItem={onDeleteItem}
				onEditItem={onEditItem}
				onMoveItemUp={onMoveItemUp}
				onMoveItemDown={onMoveItemDown}
			/>
		</section>
	);
};

export default CategoryBlockComponent;
