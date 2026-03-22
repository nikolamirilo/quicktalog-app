"use client";
import ItemInput from "@/components/catalogue/inputs/ItemInput";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { ContentLayout, Item } from "@quicktalog/common";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (item: Item, addAnother: boolean) => void;
	initialItem?: Item;
	currency: string;
	layout?: ContentLayout | null;
	checkItemLimits?: () => boolean;
	onShowLimits?: () => void;
}

const createDefaultItem = (): Item => ({
	id: crypto.randomUUID(),
	order: 0,
	name: "",
	description: "",
	image: "",
	price: 0,
	isFree: false,
});

const ItemModal = ({
	isOpen,
	onClose,
	onSave,
	initialItem,
	currency,
	layout,
	checkItemLimits,
	onShowLimits,
}: ItemModalProps) => {
	const { setIsSidebarOpen } = useCatalogueContext() || {};
	const [item, setItem] = useState<Item>(initialItem || createDefaultItem());
	const [isUploadingImage, setIsUploadingImage] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
			setItem(initialItem || createDefaultItem());
		}
	}, [isOpen, initialItem]);

	const handleSave = (addAnother: boolean) => {
		// If adding a new item, check limits before saving
		if (!initialItem && checkItemLimits && checkItemLimits()) {
			onShowLimits?.();
			onClose();
			return;
		}

		onSave(item, addAnother);
		if (addAnother) {
			setItem(createDefaultItem());
		} else {
			onClose();
		}
	};

	const isFormValid =
		item.name.trim().length > 0 &&
		(item.isFree || item.price >= 0) &&
		!isUploadingImage;

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AlertDialogContent className="w-[95vw] md:max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl gap-0 max-h-[90vh] flex flex-col">
				{/* Header */}
				<AlertDialogTitle className="p-4 sm:p-6 pb-4 relative border-b border-gray-100 flex-shrink-0">
					<button
						className="absolute right-4 sm:right-6 top-4 sm:top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
						onClick={onClose}
					>
						<X className="w-5 h-5 text-gray-400" />
					</button>
					<div className="text-xl sm:text-2xl font-bold text-gray-900">
						{initialItem ? "Edit Item" : "Add Item"}
					</div>
				</AlertDialogTitle>

				<div className="flex-1 overflow-y-auto p-4 sm:p-6">
					<ItemInput
						currency={currency}
						layout={layout}
						onChange={setItem}
						onUploadingChange={setIsUploadingImage}
						value={item}
					/>
				</div>

				<div className="p-4 sm:p-6 pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-gray-100 flex-shrink-0 bg-white">
					<Button
						className="w-full sm:w-auto"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>

					{!initialItem && (
						<Button
							className="w-full sm:w-auto"
							disabled={!isFormValid}
							onClick={() => handleSave(true)}
							variant="outline"
						>
							Add Item & Add Another
						</Button>
					)}

					<Button
						className="w-full sm:w-auto"
						disabled={!isFormValid}
						onClick={() => handleSave(false)}
					>
						{initialItem ? "Save Item" : "Add Item"}
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ItemModal;
