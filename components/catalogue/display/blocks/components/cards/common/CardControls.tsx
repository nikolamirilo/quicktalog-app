"use client";
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

interface CardControlsProps {
	onEdit: () => void;
	onDelete: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
}

const CardControls = ({
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: CardControlsProps) => {
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
			<button
				className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 text-gray-600 transition-colors"
				onClick={(e) => {
					e.stopPropagation();
					onEdit();
				}}
				title="Edit Item"
			>
				<Edit2 className="w-4 h-4" />
			</button>
			<button
				className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500 transition-colors"
				onClick={(e) => {
					e.stopPropagation();
					if (confirm("Are you sure you want to delete this item?")) {
						onDelete();
					}
				}}
				title="Delete Item"
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	);
};

export default CardControls;
