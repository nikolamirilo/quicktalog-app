"use client";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/constants";
import { BUSINESS_TYPES } from "@quicktalog/common";
import React from "react";

export interface CategorySetupProps {
	formData: {
		currency?: string;
		businessType?: string;
		[key: string]: any;
	};
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	errors?: { [key: string]: string };
	touched?: { [key: string]: boolean };
	type: "create" | "edit";
}

const CategorySetup: React.FC<CategorySetupProps> = ({
	formData,
	setFormData,
	errors = {},
	touched = {},
	type,
}) => {
	const handleBusinessTypeChange = (value: string) => {
		setFormData((prev: any) => ({ ...prev, businessType: value }));
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="flex flex-col gap-3">
				<Label
					className="text-product-foreground font-medium font-body"
					htmlFor="currency"
				>
					Currency
				</Label>
				<Select
					disabled={type === "edit" ? true : false}
					onValueChange={(value) =>
						setFormData({ ...formData, currency: value })
					}
					value={formData.currency}
				>
					<SelectTrigger
						className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary text-sm sm:text-base"
						id="currency"
					>
						<SelectValue placeholder="Select currency" />
					</SelectTrigger>
					<SelectContent>
						{CURRENCIES.map((curr) => (
							<SelectItem key={curr.value} value={curr.value}>
								{curr.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-3">
				<Label
					className="text-product-foreground font-medium font-body"
					htmlFor="businessType"
				>
					Business Type<span className="text-red-500 ml-1">*</span>
				</Label>
				<Select
					onValueChange={handleBusinessTypeChange}
					value={formData.businessType}
				>
					<SelectTrigger className="bg-product-background border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base">
						<SelectValue placeholder="Select type" />
					</SelectTrigger>
					<SelectContent>
						{BUSINESS_TYPES.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{touched?.businessType && errors?.businessType && (
					<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
						{errors.businessType}
					</div>
				)}
			</div>
		</div>
	);
};

export default CategorySetup;
