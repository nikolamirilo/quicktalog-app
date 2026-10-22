"use client";
import { Check } from "lucide-react";
import { BlockMenu } from "@/components/catalogue/cards/common/BlockMenu";
import { cn } from "@/lib/ui/cn";

/**
 * The hover group a block's edit controls listen to. Renderers put it on their
 * outer element in edit mode only, so view-mode markup is unchanged.
 */
export const BLOCK_CONTROLS_GROUP = "group/block";

interface BlockControlsProps {
	/** Short name of the block type, shown at the start of the row. */
	label: string;
	/** The block's own name, if it has one; used by the menu. */
	name?: string;
	editLabel?: string;
	onEdit?: () => void;
	/** Inline editing is on: the row shows a Done button instead of the edit entry. */
	isEditing?: boolean;
	currentLayout?: string;
	onLayoutChange?: (layout: string) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onDelete?: () => void;
}

/**
 * The edit row of a block without a section header (text, divider, embed,
 * custom code, items without a heading): its type on the left and the ⋯ menu
 * on the right. It sits above the block, never on top of it. Edit-only product
 * chrome inside `.catalogue-root`, so type is set explicitly.
 */
const BlockControls = ({
	label,
	name,
	editLabel,
	onEdit,
	isEditing,
	...menu
}: BlockControlsProps) => {
	return (
		<div
			className={cn(
				"relative z-20 mb-2 flex items-center justify-between gap-2 font-product-body text-sm font-normal not-italic leading-none tracking-normal transition-opacity duration-200",
				"focus-within:opacity-100 has-[[data-state=open]]:opacity-100 group-hover/block:opacity-100 [@media(hover:hover)]:opacity-0",
				isEditing && "[@media(hover:hover)]:opacity-100",
			)}
			onClick={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<span className="inline-flex h-7 min-w-0 items-center truncate rounded-full border border-product-border bg-product-card px-2.5 text-xs font-semibold text-product-muted">
				{label}
			</span>
			<div className="flex flex-none items-center gap-1.5">
				{isEditing && onEdit && (
					<button
						className="inline-flex h-8 items-center gap-1.5 rounded-full bg-product-primary px-3 text-xs font-semibold text-product-foreground shadow-product-primary transition-colors hover:bg-product-primary-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary"
						onClick={onEdit}
						type="button"
					>
						<Check aria-hidden="true" className="size-3.5" />
						Done
					</button>
				)}
				<BlockMenu
					{...menu}
					className="[@media(hover:hover)]:opacity-100"
					editLabel={editLabel}
					name={name || label}
					onEdit={isEditing ? undefined : onEdit}
					size="sm"
				/>
			</div>
		</div>
	);
};

export default BlockControls;
