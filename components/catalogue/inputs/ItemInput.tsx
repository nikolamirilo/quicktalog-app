import { ContentLayout, Item } from "@quicktalog/common";
import ItemDetails from "./item/ItemDetails";
import ItemImage from "./item/ItemImage";
import ItemPricing from "./item/ItemPricing";

interface ItemInputProps {
	value: Item;
	onChange: (value: Item) => void;
	currency: string;
	layout?: ContentLayout | null;
	onUploadingChange?: (isUploading: boolean) => void;
	categoryName?: string;
}

const ItemInput = ({
	value,
	onChange,
	currency,
	layout,
	onUploadingChange,
	categoryName,
}: ItemInputProps) => {
	return (
		<div className="space-y-2 md:space-y-4 p-1 !z-[90000]">
			<ItemDetails
				categoryName={categoryName}
				onChange={onChange}
				value={value}
			/>
			<ItemPricing currency={currency} onChange={onChange} value={value} />
			<ItemImage
				layout={layout}
				onChange={onChange}
				onUploadingChange={onUploadingChange}
				value={value}
			/>
		</div>
	);
};

export default ItemInput;
