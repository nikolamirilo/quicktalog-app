"use client";
import ItemInput from "@/components/catalogue/inputs/ItemInput";
import {
	BuilderDialogBody,
	BuilderDialogClose,
	BuilderDialogFooter,
	BuilderDialogHeader,
	builderDialogFrame,
} from "@/components/catalogue/modals/content/BuilderDialog";
import { AppDialogContent } from "@/components/modals/AppDialog";
import {
	AlertDialog,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { ContentLayout, Item } from "@quicktalog/common";
import { cn } from "@/lib/ui/cn";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (item: Item, addAnother: boolean) => void;
	initialItem?: Item;
	currency: string;
	layout?: ContentLayout | null;
	checkItemLimits?: () => boolean;
	onShowLimits?: () => void;
	categoryName?: string;
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
	categoryName,
}: ItemModalProps) => {
	const { setIsSidebarOpen } = useCatalogueContext() || {};
	const [item, setItem] = useState<Item>(initialItem || createDefaultItem());
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [showAdded, setShowAdded] = useState(false);
	const addedTimer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (isOpen) {
			setIsSidebarOpen?.(false);
			setItem(initialItem || createDefaultItem());
			setShowAdded(false);
		}
	}, [isOpen, initialItem]);

	const handleSave = (addAnother: boolean) => {
		if (!initialItem && checkItemLimits && checkItemLimits()) {
			onShowLimits?.();
			onClose();
			return;
		}

		onSave(item, addAnother);
		if (addAnother) {
			setItem(createDefaultItem());
			setShowAdded(true);
			if (addedTimer.current) clearTimeout(addedTimer.current);
			addedTimer.current = setTimeout(() => setShowAdded(false), 2000);
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
			<AppDialogContent className={cn(builderDialogFrame, "max-w-[640px]")}>
				<BuilderDialogHeader>
					<div className="min-w-0">
						<AlertDialogTitle>
							{initialItem ? "Edit Item" : "Add Item"}
						</AlertDialogTitle>
						<AlertDialogDescription className="mt-1 text-sm">
							{categoryName
								? `In ${categoryName}`
								: "Name, price and picture of the item."}
						</AlertDialogDescription>
					</div>
					<BuilderDialogClose onClick={onClose} />
				</BuilderDialogHeader>

				<BuilderDialogBody>
					{showAdded && (
						<div
							className="mb-4 flex items-center gap-2 rounded-xl bg-product-success-soft px-3 py-2 text-sm font-semibold text-product-success animate-in fade-in slide-in-from-top-2 duration-200"
							role="status"
						>
							<Check aria-hidden="true" className="size-4 flex-none" />
							Item added
						</div>
					)}
					<ItemInput
						categoryName={categoryName}
						currency={currency}
						layout={layout}
						onChange={setItem}
						onUploadingChange={setIsUploadingImage}
						value={item}
					/>
				</BuilderDialogBody>

				<BuilderDialogFooter>
					<Button onClick={onClose} variant="outline">
						Cancel
					</Button>

					{!initialItem && (
						<Button
							disabled={!isFormValid}
							onClick={() => handleSave(true)}
							variant="outline"
						>
							<span className="hidden sm:inline">
								Add Item &amp; Add Another
							</span>
							<span className="sm:hidden">Add Another</span>
						</Button>
					)}

					<Button
						className={cn(
							!initialItem && "!basis-full min-[520px]:!basis-auto",
						)}
						disabled={!isFormValid}
						onClick={() => handleSave(false)}
					>
						{initialItem ? "Save Item" : "Add Item"}
					</Button>
				</BuilderDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
};

export default ItemModal;
