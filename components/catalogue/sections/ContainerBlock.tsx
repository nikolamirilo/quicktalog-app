"use client";
import type { ContainerBlock } from "@quicktalog/common";
import "swiper/css";
import "swiper/css/pagination";
import BlockControls from "../cards/common/BlockControls";
import Items from "./common/Items";

interface ContainerBlockProps {
	block: ContainerBlock;
	slug: string;
	isExpanded: boolean;
	currency: string;
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
	onUpdateBlock?: (data: Partial<ContainerBlock>) => void;
}

const ContainerBlockComponent = ({
	block,
	slug,
	isExpanded,
	currency,
	theme,
	mode,
	currentLayout,
	onAddItem,
	blockIndex,
	onDelete,
	onDeleteItem,
	onEdit,
	onEditItem,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	onMoveItemUp,
	onMoveItemDown,
	onUpdateBlock,
}: ContainerBlockProps) => {
	const showContent = true;

	if (!block.items || !Array.isArray(block.items)) {
		if (mode !== "edit") {
			return (
				<section
					className="mb-5"
					id={`${slug}-${block.order}`}
					key={`${slug}-${block.order}`}
				>
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

	return (
		<section
			className={`mb-5 relative group/container ${
				mode === "edit"
					? "border-2 border-dashed border-[var(--catalogue-text)]/20 rounded-lg p-4 transition-all"
					: ""
			}`}
			id={`${slug}-${block.order}`}
			key={`${slug}-${block.order}`}
		>
			{mode === "edit" && (
				<BlockControls
					currentLayout={currentLayout}
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onLayoutChange={(layout) =>
						onUpdateBlock && onUpdateBlock({ layout: layout as any })
					}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}

			<Items
				block={block}
				blockIndex={blockIndex}
				currency={currency}
				currentLayout={currentLayout}
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

export default ContainerBlockComponent;
