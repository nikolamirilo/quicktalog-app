import ImageDropzone from "@/components/general/ImageDropzone";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Item } from "@/types/catalogue";
import { ContentLayout } from "@/types/enums";

import { useEffect, useState } from "react";

interface ItemInputProps {
	value: Item;
	onChange: (value: Item) => void;
	currency: string;
	layout?: ContentLayout | null;
}

const DENOMINATORS = [
	{ value: "none", label: "none" },
	{ value: "kg", label: "kg" },
	{ value: "g", label: "g" },
	{ value: "l", label: "l" },
	{ value: "ml", label: "ml" },
	{ value: "pcs", label: "pcs" },
	{ value: "portion", label: "portion" },
];

const ItemInput = ({ value, onChange, currency, layout }: ItemInputProps) => {
	const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
	const [isUploading, setIsUploading] = useState(false);
	const [priceString, setPriceString] = useState(
		value.price && value.price !== 0 ? value.price.toString() : "",
	);
	const [discountPriceString, setDiscountPriceString] = useState(
		value.discount?.discountedPrice && value.discount?.discountedPrice !== 0
			? value.discount?.discountedPrice.toString()
			: "",
	);

	useEffect(() => {
		const currentNum = parseFloat(priceString) || 0;
		if (value.price === currentNum) return;
		setPriceString(
			value.price && value.price !== 0 ? value.price.toString() : "",
		);
	}, [value.price]);

	useEffect(() => {
		const discPrice = value.discount?.discountedPrice || 0;
		const currentNum = parseFloat(discountPriceString) || 0;
		if (discPrice === currentNum) return;
		setDiscountPriceString(
			discPrice && discPrice !== 0 ? discPrice.toString() : "",
		);
	}, [value.discount?.discountedPrice]);

	const handlePriceStringChange = (val: string) => {
		if (!/^\d*\.?\d{0,2}$/.test(val)) return;
		setPriceString(val);
		handlePriceChange(val);
	};

	const handleDiscountPriceStringChange = (val: string) => {
		if (!/^\d*\.?\d{0,2}$/.test(val)) return;
		setDiscountPriceString(val);
		handleDiscountChange("discountedPrice", val);
	};

	const handlePriceChange = (price: string) => {
		const numPrice = parseFloat(price) || 0;
		onChange({ ...value, price: numPrice });
	};

	const handleDiscountChange = (
		field: "discountedPrice" | "discountPercentage",
		val: string,
	) => {
		const numVal = parseFloat(val) || 0;
		const currentPrice = value.price || 0;
		let newDiscount = { ...value.discount, [field]: numVal } as any;

		if (currentPrice > 0) {
			if (field === "discountedPrice") {
				newDiscount.discountPercentage = Math.round(
					((currentPrice - numVal) / currentPrice) * 100,
				);
			} else if (field === "discountPercentage") {
				newDiscount.discountedPrice = parseFloat(
					(currentPrice * (1 - numVal / 100)).toFixed(2),
				);
			}
		}

		onChange({
			...value,
			discount: {
				...value.discount,
				isOnDiscount: true,
				...newDiscount,
			},
		});
	};

	const toggleDiscount = (checked: boolean) => {
		if (checked) {
			onChange({
				...value,
				discount: {
					isOnDiscount: true,
					discountPercentage: 0,
					discountedPrice: value.price,
				},
			});
		} else {
			onChange({
				...value,
				discount: undefined,
			});
		}
	};

	return (
		<div className="space-y-6 p-1">
			{/* Item Name */}
			<div className="space-y-2">
				<Label htmlFor="item-name">
					Item Name <span className="text-red-500">*</span>
				</Label>
				<Input
					id="item-name"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Pancakessadsad"
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
					placeholder="e.g. Pancakes with cherries"
					value={value.description}
				/>
			</div>

			{/* Price Row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
				<div className="space-y-2">
					<Label htmlFor="item-price">
						Item Price ({currency}) <span className="text-red-500">*</span>
					</Label>
					<div className="flex gap-2">
						<Input
							className="flex-1"
							disabled={value.isFree}
							id="item-price"
							onChange={(e) => handlePriceStringChange(e.target.value)}
							type="text"
							value={value.isFree ? "0" : priceString}
						/>
						<Select
							onValueChange={(val) =>
								onChange({
									...value,
									denominator: val === "none" ? undefined : val,
								})
							}
							value={value.denominator || "none"}
						>
							<SelectTrigger className="w-[100px]">
								<SelectValue placeholder="Unit" />
							</SelectTrigger>
							<SelectContent>
								{DENOMINATORS.map((d) => (
									<SelectItem key={d.value} value={d.value}>
										{d.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex gap-6 pt-10">
					<div className="flex items-center space-x-2">
						<Checkbox
							checked={value.isFree}
							id="is-free"
							onCheckedChange={(checked) =>
								onChange({
									...value,
									isFree: checked as boolean,
									price: checked ? 0 : value.price,
								})
							}
						/>
						<Label className="font-normal cursor-pointer" htmlFor="is-free">
							Free
						</Label>
					</div>

					<div className="flex items-center space-x-2">
						<Checkbox
							checked={!!value.discount?.isOnDiscount}
							disabled={value.isFree}
							id="on-sale"
							onCheckedChange={(checked) => toggleDiscount(checked as boolean)}
						/>
						<Label className="font-normal cursor-pointer" htmlFor="on-sale">
							On Sale
						</Label>
					</div>
				</div>
			</div>

			{/* Sale Fields */}
			{value.discount?.isOnDiscount && !value.isFree && (
				<div className="grid grid-cols-2 gap-6">
					<div className="space-y-2">
						<Label htmlFor="sale-price">
							Sale Price ({currency}) <span className="text-red-500">*</span>
						</Label>
						<Input
							id="sale-price"
							onChange={(e) => handleDiscountPriceStringChange(e.target.value)}
							type="text"
							value={discountPriceString}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sale-percentage">
							Percentage <span className="text-red-500">*</span>
						</Label>
						<div className="relative">
							<Input
								id="sale-percentage"
								onChange={(e) =>
									handleDiscountChange("discountPercentage", e.target.value)
								}
								type="text"
								value={value.discount.discountPercentage}
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
								%
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Image Upload - Hidden for variant_3 layout */}
			{layout !== "variant_3" && (
				<Tabs
					className="w-full"
					onValueChange={(v) => setImageTab(v as any)}
					value={imageTab}
				>
					<TabsList className="bg-transparent p-0 border-b border-gray-200 w-full justify-start rounded-none h-auto">
						<TabsTrigger
							className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-4 pb-2"
							value="upload"
						>
							Upload File <span className="text-red-500 ml-1">*</span>
						</TabsTrigger>
						<TabsTrigger
							className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-4 pb-2"
							value="url"
						>
							URL
						</TabsTrigger>
					</TabsList>
					<TabsContent className="pt-4" value="upload">
						<ImageDropzone
							className="w-full aspect-video"
							image={value.image}
							onUploadComplete={(url) => onChange({ ...value, image: url })}
							removeImage={() => onChange({ ...value, image: "" })}
							setIsUploading={setIsUploading}
						/>
					</TabsContent>
					<TabsContent className="py-2" value="url">
						<Input
							onChange={(e) => onChange({ ...value, image: e.target.value })}
							placeholder="https://example.com/image.jpg"
							value={value.image}
						/>
						{value.image && (
							<ImageDropzone
								className="w-full aspect-video"
								image={value.image}
								onUploadComplete={(url) => onChange({ ...value, image: url })}
								removeImage={() => onChange({ ...value, image: "" })}
								setIsUploading={setIsUploading}
							/>
						)}
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
};

export default ItemInput;
