import { builderFieldClass } from "@/components/catalogue/modals/content/BuilderDialog";
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
import { cn } from "@/lib/ui/cn";
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

/** A checkbox drawn as a pill toggle; the whole pill is its label. */
const toggleClass =
	"inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-product-border bg-product-card pl-2.5 pr-3.5 text-[13.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-border-strong has-[[data-state=checked]]:border-product-primary-accent has-[[data-state=checked]]:bg-product-primary-soft has-[[data-state=checked]]:text-product-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

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
			<div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-6">
				<div className="space-y-1.5">
					<Label htmlFor="item-price">Price ({currency})</Label>
					<div className="flex gap-2">
						<Input
							className={cn(builderFieldClass, "min-w-0 flex-1")}
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
								className={cn(builderFieldClass, "w-[112px] flex-none")}
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

				<div className="flex items-center gap-2 md:h-10">
					<label className={toggleClass} htmlFor="is-free">
						<Checkbox
							checked={value.isFree}
							className="h-4 w-4 rounded-[5px]"
							id="is-free"
							onCheckedChange={(checked) =>
								onChange({
									...value,
									isFree: checked as boolean,
									price: checked ? 0 : value.price,
								})
							}
						/>
						Free
					</label>

					<label className={toggleClass} htmlFor="discount">
						<Checkbox
							checked={!!value.discount?.isOnDiscount}
							className="h-4 w-4 rounded-[5px]"
							disabled={value.isFree}
							id="discount"
							onCheckedChange={(checked) => toggleDiscount(checked as boolean)}
						/>
						On sale
					</label>
				</div>
			</div>

			{value.discount?.isOnDiscount && !value.isFree && (
				<div className="grid grid-cols-2 gap-3 md:gap-6">
					<div className="space-y-1.5">
						<Label htmlFor="sale-price">
							Sale price ({currency}){" "}
							<span aria-hidden="true" className="text-product-error">
								*
							</span>
						</Label>
						<Input
							className={builderFieldClass}
							id="sale-price"
							inputMode="decimal"
							onBlur={handleDiscountBlur}
							onChange={(e) => handleDiscountPriceStringChange(e.target.value)}
							type="text"
							value={discountPriceString}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="sale-percentage">
							Percentage{" "}
							<span aria-hidden="true" className="text-product-error">
								*
							</span>
						</Label>
						<div className="relative">
							<Input
								className={cn(builderFieldClass, "pr-8")}
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
								className="absolute right-3 top-1/2 -translate-y-1/2 text-product-muted"
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
