import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@quicktalog/common";

export interface ItemDetailsProps {
	value: Item;
	onChange: (value: Item) => void;
}

const ItemDetails = ({ value, onChange }: ItemDetailsProps) => {
	return (
		<>
			{/* Item Name */}
			<div className="space-y-2">
				<Label htmlFor="item-name">
					Item Name <span className="text-red-500">*</span>
				</Label>
				<Input
					id="item-name"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Pancakes"
					value={value.name}
				/>
			</div>

			{/* Item Description */}
			<div className="space-y-2">
				<Label htmlFor="item-description">Item Description</Label>
				<Textarea
					className="resize-none min-h-[100px]"
					id="item-description"
					onChange={(e) => onChange({ ...value, description: e.target.value })}
					placeholder="e.g. Pancakes with Nutella, cherries, and ice cream"
					value={value.description}
				/>
			</div>
		</>
	);
};

export default ItemDetails;
