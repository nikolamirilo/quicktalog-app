"use client";
import { type ContentLayout, layouts } from "@quicktalog/common";
import {
	ChevronDown,
	ChevronUp,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import type { MouseEvent } from "react";
import { LayoutGlyph } from "@/components/catalogue/modals/content/LayoutPicker";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/ui/cn";

export interface BlockMenuProps {
	/** Section name, used in the trigger's accessible name and as the menu heading. */
	name: string;
	editLabel?: string;
	onEdit?: () => void;
	currentLayout?: string;
	onLayoutChange?: (layout: string) => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onDelete?: () => void;
	size?: "sm" | "md";
	className?: string;
}

// The menu is portaled, but React events still bubble to the section, whose
// clicks toggle the header or start inline editing.
const stop = (e: MouseEvent) => e.stopPropagation();

/**
 * The ⋯ menu of a catalogue section: edit, layout, move and delete. On devices
 * that hover it shows when the section is hovered or focused; on touch it is
 * always shown. Drawn inside `.catalogue-root`, so it sets its own type.
 */
export function BlockMenu({
	name,
	editLabel = "Edit section",
	onEdit,
	currentLayout,
	onLayoutChange,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	onDelete,
	size = "md",
	className,
}: BlockMenuProps) {
	const layoutLabel = layouts.find((l) => l.key === currentLayout)?.label;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					aria-label={`${name} options`}
					className={cn(
						"relative flex flex-none items-center justify-center rounded-full border border-product-border bg-product-card font-product-body text-product-foreground-accent shadow-product transition-[opacity,background-color,color] duration-200 before:absolute before:content-[''] hover:bg-product-background-hero hover:text-product-foreground focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary data-[state=open]:bg-product-background-hero data-[state=open]:text-product-foreground data-[state=open]:opacity-100 group-hover/block:opacity-100 [@media(hover:hover)]:opacity-0",
						size === "md"
							? "h-9 w-9 before:-inset-1 [&_svg]:size-[18px]"
							: "h-8 w-8 before:-inset-1.5 [&_svg]:size-4",
						className,
					)}
					onClick={stop}
					onPointerDown={(e) => e.stopPropagation()}
					title={`${name} options`}
					type="button"
				>
					<MoreHorizontal aria-hidden="true" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-60" onClick={stop}>
				<DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
				{onEdit && (
					<DropdownMenuItem onSelect={onEdit}>
						<Pencil aria-hidden="true" />
						{editLabel}
					</DropdownMenuItem>
				)}

				{onLayoutChange && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>Layout</DropdownMenuLabel>
						<DropdownMenuRadioGroup
							className="grid grid-cols-4 gap-1.5 px-1.5 pb-1 pt-0.5"
							onValueChange={onLayoutChange}
							value={currentLayout}
						>
							{layouts.map((layout) => (
								<DropdownMenuRadioItem
									aria-label={layout.label}
									className="h-11 min-h-0 justify-center rounded-[10px] border-[1.5px] border-product-border bg-product-background-hero p-0 focus:border-product-border-strong focus:bg-product-background-hero data-[state=checked]:border-product-primary-accent data-[state=checked]:bg-product-primary-soft data-[state=checked]:shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)] [&>span:first-child]:hidden"
									key={layout.key}
									title={layout.label}
									value={layout.key}
								>
									<LayoutGlyph
										className="w-9"
										layout={layout.key as ContentLayout}
									/>
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
						{layoutLabel && (
							<p className="px-3 pb-1 pt-1.5 text-xs text-product-muted">
								{layoutLabel}
							</p>
						)}
					</>
				)}

				{(onMoveUp || onMoveDown) && (
					<>
						<DropdownMenuSeparator />
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
					</>
				)}

				{onDelete && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-product-error focus:bg-product-error-soft focus:text-product-error"
							onSelect={() => {
								if (confirm("Are you sure you want to delete this section?")) {
									onDelete();
								}
							}}
						>
							<Trash2 aria-hidden="true" />
							Delete section
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
