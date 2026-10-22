"use client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { isItemsBlock } from "@/lib/catalogue/content-blocks";
import {
	ChevronDown,
	ChevronUp,
	FolderInput,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";

interface CardControlsProps {
	onEdit: () => void;
	onDelete: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	blockIndex?: number;
	itemIndex?: number;
}

/**
 * Positioning of the item menu trigger. It is a small pill in the card's
 * top-right corner, no taller than the title line, and the card title that
 * follows it (`#item-title-*`) gets right padding so the pill never covers
 * text. Cards whose first full-width child is the image (`.w-full`, the
 * top-image and carousel cards) have the pill over the image instead, so their
 * title keeps its full width. This only renders in edit mode, so the published
 * card is untouched.
 */
const wrapperClasses = [
	"absolute right-1 top-1 z-20 font-product-body text-sm font-normal not-italic leading-none tracking-normal sm:right-2 sm:top-2",
	"transition-opacity duration-200 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0",
	"[&~*_[id^=item-title-]]:pr-10 sm:[&~*_[id^=item-title-]]:pr-11",
	"[&~.w-full~*_[id^=item-title-]]:pr-0 sm:[&~.w-full~*_[id^=item-title-]]:pr-0",
].join(" ");

const CardControls = ({
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	blockIndex,
	itemIndex,
}: CardControlsProps) => {
	const catalogueContext = useCatalogueContext();
	const sections = catalogueContext?.catalogue?.content || [];
	const moveItemToBlock = catalogueContext?.moveItemToBlock;

	const availableSections = sections
		.map((block, index) => ({ block, index }))
		.filter(({ block, index }) => isItemsBlock(block) && index !== blockIndex);

	const canMoveToSection =
		availableSections.length > 0 &&
		blockIndex !== undefined &&
		itemIndex !== undefined &&
		!!moveItemToBlock;

	return (
		<div
			className={wrapperClasses}
			onClick={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						aria-label="More options"
						className="relative flex h-[22px] w-8 items-center justify-center rounded-full border border-product-border bg-product-card text-product-foreground-accent shadow-product transition-colors before:absolute before:-inset-2.5 before:content-[''] hover:bg-product-background-hero hover:text-product-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary data-[state=open]:bg-product-background-hero sm:h-8 sm:before:-inset-1.5 [&_svg]:size-4"
						onClick={(e) => e.stopPropagation()}
						title="More options"
						type="button"
					>
						<MoreHorizontal aria-hidden="true" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="min-w-[200px]"
					// The menu is portaled, but React events still bubble to the card,
					// whose click opens the item.
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenuItem onSelect={onEdit}>
						<Pencil aria-hidden="true" />
						Edit item
					</DropdownMenuItem>
					{onMoveUp && (
						<DropdownMenuItem disabled={isFirst} onSelect={onMoveUp}>
							<ChevronUp aria-hidden="true" />
							Move up
						</DropdownMenuItem>
					)}
					{onMoveDown && (
						<DropdownMenuItem disabled={isLast} onSelect={onMoveDown}>
							<ChevronDown aria-hidden="true" />
							Move down
						</DropdownMenuItem>
					)}
					{canMoveToSection && (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<FolderInput aria-hidden="true" />
								Move to section
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent
									className="max-w-[260px] min-w-[200px]"
									onClick={(e) => e.stopPropagation()}
								>
									{availableSections.map(({ block, index }) => (
										<DropdownMenuItem
											key={block.id}
											onSelect={() =>
												moveItemToBlock?.(
													blockIndex as number,
													itemIndex as number,
													index,
												)
											}
										>
											<span className="min-w-0 flex-1 truncate">
												{isItemsBlock(block) && block.name
													? block.name
													: "Untitled section"}
											</span>
										</DropdownMenuItem>
									))}
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="text-product-error focus:bg-product-error-soft focus:text-product-error"
						onSelect={() => {
							if (confirm("Are you sure you want to delete this item?")) {
								onDelete();
							}
						}}
					>
						<Trash2 aria-hidden="true" />
						Delete item
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default CardControls;
