"use client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/ui/cn";
import { layouts } from "@quicktalog/common";
import {
	Check,
	ChevronDown,
	ChevronUp,
	LayoutGrid,
	Pencil,
	Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * The hover group a block's edit toolbar listens to. Renderers put it on their
 * outer element in edit mode only, so view-mode markup is unchanged.
 */
export const BLOCK_CONTROLS_GROUP = "group/block";

/**
 * Edit-only product chrome inside `.catalogue-root`: the catalogue pins Lora at
 * 18px there and product focus rules are excluded, so type and focus are set
 * explicitly here.
 */
const toolButtonClasses =
	"relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-product-foreground-accent transition-colors hover:bg-product-background-hero hover:text-product-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent data-[state=open]:bg-product-background-hero [@media(hover:hover)]:h-9 [@media(hover:hover)]:w-9 [&_svg]:size-[18px]";

const ToolButton = ({
	label,
	onClick,
	disabled,
	className,
	children,
}: {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}) => (
	<button
		aria-label={label}
		className={cn(toolButtonClasses, className)}
		disabled={disabled}
		onClick={(e) => {
			e.stopPropagation();
			if (!disabled) onClick();
		}}
		title={label}
		type="button"
	>
		{children}
	</button>
);

interface BlockControlsProps {
	/** Short name of the block type, shown at the start of the toolbar. */
	label?: string;
	onMoveDown?: () => void;
	onMoveUp?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onDelete?: () => void;
	currentLayout?: string;
	onLayoutChange?: (layout: string) => void;
	onEdit?: () => void;
	isEditing?: boolean;
}

/**
 * The edit toolbar of a catalogue block. It sits in its own row above the
 * block, never on top of it, so it cannot cover a title at any width. On
 * devices that hover it fades in when the block is hovered or focused; on
 * touch it is always shown.
 */
const BlockControls = ({
	label,
	onMoveDown,
	onMoveUp,
	isFirst,
	isLast,
	onDelete,
	currentLayout,
	onLayoutChange,
	onEdit,
	isEditing,
}: BlockControlsProps) => {
	return (
		<div
			className={cn(
				"relative z-20 mb-2 flex justify-end font-product-body text-sm font-normal not-italic leading-none tracking-normal transition-opacity duration-200",
				"focus-within:opacity-100 has-[[data-state=open]]:opacity-100 group-hover/block:opacity-100 [@media(hover:hover)]:opacity-0",
				isEditing && "[@media(hover:hover)]:opacity-100",
			)}
			onClick={(e) => e.stopPropagation()}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<div
				aria-label={label ? `${label} tools` : "Block tools"}
				className="flex max-w-full items-center gap-0.5 rounded-full border border-product-border bg-product-card p-1 shadow-product"
				role="toolbar"
			>
				{label && (
					<span className="min-w-0 truncate px-2.5 text-xs font-semibold text-product-muted">
						{label}
					</span>
				)}
				{onEdit && (
					<ToolButton
						className={cn(
							isEditing &&
								"bg-product-primary text-product-foreground hover:bg-product-primary-accent",
						)}
						label={isEditing ? "Finish editing" : "Edit content"}
						onClick={onEdit}
					>
						{isEditing ? <Check /> : <Pencil />}
					</ToolButton>
				)}
				{onLayoutChange && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								aria-label="Change layout"
								className={toolButtonClasses}
								onClick={(e) => e.stopPropagation()}
								title="Change layout"
								type="button"
							>
								<LayoutGrid />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-52"
							onClick={(e) => e.stopPropagation()}
						>
							<DropdownMenuLabel>Layout</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								onValueChange={onLayoutChange}
								value={currentLayout}
							>
								{layouts.map((layout) => (
									<DropdownMenuRadioItem key={layout.key} value={layout.key}>
										{layout.label}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
				{onMoveUp && (
					<ToolButton disabled={isFirst} label="Move up" onClick={onMoveUp}>
						<ChevronUp />
					</ToolButton>
				)}
				{onMoveDown && (
					<ToolButton disabled={isLast} label="Move down" onClick={onMoveDown}>
						<ChevronDown />
					</ToolButton>
				)}
				{onDelete && (
					<ToolButton
						className="text-product-error hover:bg-product-error-soft hover:text-product-error"
						label="Delete section"
						onClick={() => {
							if (confirm("Are you sure you want to delete this section?")) {
								onDelete();
							}
						}}
					>
						<Trash2 />
					</ToolButton>
				)}
			</div>
		</div>
	);
};

export default BlockControls;
