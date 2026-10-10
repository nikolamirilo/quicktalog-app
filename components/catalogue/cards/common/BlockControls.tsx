import { layouts } from "@quicktalog/common";
import { useEffect, useRef, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { FiChevronDown, FiChevronUp, FiLayout, FiTrash2 } from "react-icons/fi";
import { IoMdCheckmark } from "react-icons/io";

const BlockControls = ({
	onMoveDown,
	onMoveUp,
	isFirst,
	isLast,
	onDelete,
	currentLayout,
	onLayoutChange,
	onEdit,
	isEditing,
}: {
	onMoveDown?: () => void;
	onMoveUp?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	onDelete?: () => void;
	currentLayout?: string;
	onLayoutChange?: (layout: string) => void;
	onEdit?: () => void;
	isEditing?: boolean;
}) => {
	const [isLayoutOpen, setIsLayoutOpen] = useState(false);
	const layoutRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				layoutRef.current &&
				!layoutRef.current.contains(event.target as Node)
			) {
				setIsLayoutOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="absolute right-2 top-2 z-20 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover/container:opacity-100 md:group-hover/header:opacity-100 transition-all duration-200">
			{onEdit && (
				<button
					aria-label={isEditing ? "Finish editing" : "Edit content"}
					className={`p-2 rounded-full shadow-sm transition-all duration-200 ${
						isEditing
							? "bg-product-primary text-white hover:bg-product-primary/90"
							: "bg-white/80 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
					}`}
					onClick={(e) => {
						e.stopPropagation();
						onEdit();
					}}
					title={isEditing ? "Finish editing" : "Edit content"}
					type="button"
				>
					{isEditing ? (
						<IoMdCheckmark className="w-5 h-5" />
					) : (
						<FaRegEdit className="w-5 h-5" />
					)}
				</button>
			)}
			{onLayoutChange && (
				<div className="relative" ref={layoutRef}>
					<button
						aria-label="Change layout"
						className="p-2 bg-white/80 rounded-full shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
						onClick={(e) => {
							e.stopPropagation();
							setIsLayoutOpen(!isLayoutOpen);
						}}
						title="Change layout"
						type="button"
					>
						<FiLayout className="w-5 h-5" />
					</button>
					{isLayoutOpen && (
						<div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 overflow-hidden">
							{layouts.map((layout) => (
								<button
									className={`w-full text-left px-4 py-2 text-sm hover:bg-product-background-hover flex items-center justify-between ${
										currentLayout === layout.key
											? "text-product-primary bg-product-background-hover"
											: "text-product-foreground"
									}`}
									key={layout.key}
									onClick={(e) => {
										e.stopPropagation();
										onLayoutChange(layout.key);
										setIsLayoutOpen(false);
									}}
								>
									{layout.label}
									{currentLayout === layout.key && (
										<div className="w-2 h-2 rounded-full bg-product-primary" />
									)}
								</button>
							))}
						</div>
					)}
				</div>
			)}
			{onMoveUp && (
				<button
					aria-label="Move container up"
					className={`p-2 bg-white/80 rounded-full shadow-sm transition-all duration-200 ${
						isFirst
							? "text-gray-300 cursor-not-allowed"
							: "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
					}`}
					disabled={isFirst}
					onClick={(e) => {
						e.stopPropagation();
						if (!isFirst) onMoveUp();
					}}
					title="Move up"
					type="button"
				>
					<FiChevronUp className="w-5 h-5" />
				</button>
			)}
			{onMoveDown && (
				<button
					aria-label="Move container down"
					className={`p-2 bg-white/80 text-gray-600 rounded-full shadow-sm transition-all duration-200 ${
						isLast
							? "text-gray-300 cursor-not-allowed"
							: "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
					}`}
					disabled={isLast}
					onClick={(e) => {
						e.stopPropagation();
						if (!isLast) onMoveDown();
					}}
					title="Move down"
					type="button"
				>
					<FiChevronDown className="w-5 h-5" />
				</button>
			)}
			{onDelete && (
				<button
					aria-label="Delete container"
					className="p-2 text-red-500 bg-white/80 hover:bg-red-50 rounded-full shadow-sm transition-all duration-200"
					onClick={(e) => {
						e.stopPropagation();
						if (confirm("Are you sure you want to delete this container?")) {
							onDelete();
						}
					}}
					title="Delete container"
					type="button"
				>
					<FiTrash2 className="w-5 h-5" />
				</button>
			)}
		</div>
	);
};

export default BlockControls;
