"use client";
import {
	builderFieldClass,
	builderTextareaClass,
} from "@/components/catalogue/modals/content/BuilderDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@quicktalog/common";
import { cn } from "@/lib/ui/cn";

interface ItemDetailsProps {
	value: Item;
	onChange: (value: Item) => void;
}

const ItemDetails = ({ value, onChange }: ItemDetailsProps) => {
	return (
		<>
			<div className="space-y-1.5">
				<Label htmlFor="item-name">
					Name{" "}
					<span aria-hidden="true" className="text-product-error">
						*
					</span>
				</Label>
				<Input
					className={builderFieldClass}
					id="item-name"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Pancakes"
					required
					value={value.name}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="item-description">Description</Label>
				<Textarea
					className={cn(builderTextareaClass, "min-h-[84px] resize-none")}
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
