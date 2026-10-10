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
						<AlertDialogTitle className="text-lg">
							{initialItem ? "Edit item" : "Add item"}
						</AlertDialogTitle>
						<AlertDialogDescription className="mt-0.5 text-[13px] leading-[18px]">
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

				{/* On phones the header × cancels, so adding fits one row. */}
				<BuilderDialogFooter>
					<Button
						className={cn(!initialItem && "max-md:hidden")}
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>

					{!initialItem && (
						<Button
							disabled={!isFormValid}
							onClick={() => handleSave(true)}
							variant="outline"
						>
							<span className="hidden md:inline">
								Add item &amp; add another
							</span>
							<span className="md:hidden">Add another</span>
						</Button>
					)}

					<Button disabled={!isFormValid} onClick={() => handleSave(false)}>
						{initialItem ? "Save item" : "Add item"}
					</Button>
				</BuilderDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
};

export default ItemModal;
