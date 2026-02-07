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
import {
	ChevronDown,
	ChevronUp,
	Edit2,
	FolderInput,
	MoreVertical,
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
	const blocks = catalogueContext?.catalogue?.content || [];
	const moveItemToBlock = catalogueContext?.moveItemToBlock;

	const availableBlocks = blocks
		.map((block, index) => ({ block, index }))
		.filter(
			({ block, index }) =>
				(block.type === "category" || block.type === "container") &&
				index !== blockIndex,
		);

	return (
		<div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
			{onMoveUp && (
				<button
					className={`p-2 bg-white rounded-full shadow-md transition-colors ${
						isFirst
							? "text-gray-300 cursor-not-allowed"
							: "text-gray-600 hover:bg-gray-50"
					}`}
					disabled={isFirst}
					onClick={(e) => {
						e.stopPropagation();
						if (!isFirst) onMoveUp();
					}}
					title="Move Up"
				>
					<ChevronUp className="w-4 h-4" />
				</button>
			)}
			{onMoveDown && (
				<button
					className={`p-2 bg-white rounded-full shadow-md transition-colors ${
						isLast
							? "text-gray-300 cursor-not-allowed"
							: "text-gray-600 hover:bg-gray-50"
					}`}
					disabled={isLast}
					onClick={(e) => {
						e.stopPropagation();
						if (!isLast) onMoveDown();
					}}
					title="Move Down"
				>
					<ChevronDown className="w-4 h-4" />
				</button>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600 transition-colors"
						onClick={(e) => e.stopPropagation()}
						title="More options"
					>
						<MoreVertical className="w-4 h-4" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="bg-product-background border border-product-border rounded-xl shadow-lg"
				>
					<DropdownMenuItem
						className="text-product-foreground hover:bg-product-hover-background cursor-pointer"
						onClick={(e) => {
							e.stopPropagation();
							onEdit();
						}}
					>
						<span className="flex items-center gap-2">
							<Edit2 className="w-4 h-4" />
							Edit
						</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="text-red-400 hover:bg-red-50 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation();
							if (confirm("Are you sure you want to delete this item?")) {
								onDelete();
							}
						}}
					>
						<span className="flex items-center gap-2">
							<Trash2 className="w-4 h-4" />
							Delete
						</span>
					</DropdownMenuItem>
					{availableBlocks.length > 0 &&
						blockIndex !== undefined &&
						itemIndex !== undefined &&
						moveItemToBlock && (
							<>
								<DropdownMenuSeparator className="my-1" />
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="cursor-pointer text-product-foreground hover:bg-product-hover-background">
										<span className="flex items-center gap-2">
											<FolderInput className="w-4 h-4" />
											Move to
										</span>
									</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent className="bg-product-background border border-product-border rounded-xl shadow-lg min-w-[200px]">
											{availableBlocks.map(({ block, index }) => (
												<DropdownMenuItem
													key={block.id}
													className="text-product-foreground hover:bg-product-hover-background cursor-pointer"
													onClick={(e) => {
														e.stopPropagation();
														moveItemToBlock(blockIndex, itemIndex, index);
													}}
												>
													<span className="flex items-center justify-between gap-3 w-full">
														<span className="font-medium truncate flex-1">
															{block.type === "category" ||
															block.type === "container"
																? block.name
																: "Unnamed"}
														</span>
														<span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
															{block.type}
														</span>
													</span>
												</DropdownMenuItem>
											))}
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
							</>
						)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default CardControls;
