"use client";
import ItemInput from "@/components/catalogue/inputs/ItemInput";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
}: ItemModalProps) => {
	const [item, setItem] = useState<Item>(initialItem || createDefaultItem());

	useEffect(() => {
		if (isOpen) {
			setItem(initialItem || createDefaultItem());
		}
	}, [isOpen, initialItem]);

	const handleSave = (addAnother: boolean) => {
		onSave(item, addAnother);
		if (addAnother) {
			setItem(createDefaultItem());
		} else {
			onClose();
		}
	};

	const isFormValid =
		item.name && (item.isFree || item.price > 0 || item.price === 0);

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AlertDialogContent className="w-[95vw] md:max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-none shadow-2xl gap-0 max-h-[90vh] flex flex-col">
				{/* Header */}
				<AlertDialogTitle className="p-6 pb-4 relative border-b border-gray-100 flex-shrink-0">
					<button
						className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
						onClick={onClose}
					>
						<X className="w-5 h-5 text-gray-400" />
					</button>
					<div className="text-2xl  font-bold text-gray-900">
						{initialItem ? "Edit Item" : "Add Item"}
					</div>
				</AlertDialogTitle>

				<div className="flex-1 overflow-y-auto p-6">
					<ItemInput
						currency={currency}
						layout={layout}
						onChange={setItem}
						value={item}
					/>
				</div>

				<div className="p-6 pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100 flex-shrink-0 bg-white">
					<Button onClick={onClose} variant="secondary">
						Cancel
					</Button>

					<Button
						disabled={!isFormValid}
						onClick={() => handleSave(true)}
						variant="outline"
					>
						Add Item & Add Another
					</Button>

					<Button disabled={!isFormValid} onClick={() => handleSave(false)}>
						{initialItem ? "Save Item" : "Add Item"}
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ItemModal;
