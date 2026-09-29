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
import { Item } from "@quicktalog/common";
import { useEffect, useState } from "react";

interface ItemPricingProps {
	value: Item;
	onChange: (value: Item) => void;
	currency: string;
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

const ItemPricing = ({ value, onChange, currency }: ItemPricingProps) => {
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

	const handlePriceBlur = () => {
		const numPrice = parseFloat(priceString) || 0;
		if (priceString !== "" && numPrice === 0) {
			onChange({ ...value, price: 0, isFree: true, discount: undefined });
		}
	};

	const handleDiscountBlur = () => {
		const dp = value.discount?.discountPercentage || 0;
		const dsString = discountPriceString.trim();
		if (dp === 100 || (dsString !== "" && (parseFloat(dsString) || 0) === 0)) {
			onChange({ ...value, price: 0, isFree: true, discount: undefined });
		}
	};

	return (
		<>
			{/* Price Row */}
			<div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6">
				<div className="space-y-2">
					<Label htmlFor="item-price">Item Price ({currency})</Label>
					<div className="flex gap-2">
						<Input
							className="min-w-0 flex-1"
							disabled={value.isFree}
							id="item-price"
							inputMode="decimal"
							onBlur={handlePriceBlur}
							onChange={(e) => handlePriceStringChange(e.target.value)}
							type="text"
							value={value.isFree ? "0" : priceString}
						/>
						<Select
							disabled={value.isFree}
							onValueChange={(val) =>
								onChange({
									...value,
									denominator: val === "none" ? undefined : val,
								})
							}
							value={value.denominator || "none"}
						>
							<SelectTrigger
								aria-label="Price unit"
								className="w-[132px] flex-none"
							>
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

				<div className="flex h-11 items-center gap-6">
					<div className="flex items-center gap-2">
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
						<Label className="cursor-pointer font-medium" htmlFor="is-free">
							Free
						</Label>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							checked={!!value.discount?.isOnDiscount}
							disabled={value.isFree}
							id="discount"
							onCheckedChange={(checked) => toggleDiscount(checked as boolean)}
						/>
						<Label className="cursor-pointer font-medium" htmlFor="discount">
							Discount
						</Label>
					</div>
				</div>
			</div>

			{/* Sale Fields */}
			{value.discount?.isOnDiscount && !value.isFree && (
				<div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 sm:gap-6">
					<div className="space-y-2">
						<Label htmlFor="sale-price">
							Sale Price ({currency}){" "}
							<span aria-hidden="true" className="text-product-error">
								*
							</span>
						</Label>
						<Input
							id="sale-price"
							inputMode="decimal"
							onBlur={handleDiscountBlur}
							onChange={(e) => handleDiscountPriceStringChange(e.target.value)}
							type="text"
							value={discountPriceString}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sale-percentage">
							Percentage{" "}
							<span aria-hidden="true" className="text-product-error">
								*
							</span>
						</Label>
						<div className="relative">
							<Input
								className="pr-9"
								id="sale-percentage"
								inputMode="numeric"
								onBlur={handleDiscountBlur}
								onChange={(e) =>
									handleDiscountChange("discountPercentage", e.target.value)
								}
								type="text"
								value={value.discount.discountPercentage}
							/>
							<span
								aria-hidden="true"
								className="absolute right-4 top-1/2 -translate-y-1/2 text-product-muted"
							>
								%
							</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ItemPricing;
