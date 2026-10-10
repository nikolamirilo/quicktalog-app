"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/constants/ocr";
import { useCatalogueName } from "@/hooks/useCatalogueName";
import { AlertCircle, CheckCircle } from "lucide-react";
import React from "react";
import { FiInfo } from "react-icons/fi";

export interface BasicInfoFieldsProps {
	formData: {
		name: string;
		heading?: string;
		language?: string;
		[key: string]: any;
	};
	handleInputChange: (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => void;
	setFormData: React.Dispatch<React.SetStateAction<any>>;
	errors?: { [key: string]: string };
	touched?: { [key: string]: boolean };
	setErrors: any;
	setTouched: any;
	type: "create" | "edit";
	onInfoClick: (field: string) => void;
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
	formData,
	handleInputChange,
	setFormData,
	errors = {},
	touched = {},
	setErrors,
	setTouched,
	type,
	onInfoClick,
}) => {
	const { handleNameChange, nameExists } = useCatalogueName({
		initialName: "name",
		type: "create",
		setFormData,
		setErrors,
		setTouched,
	});

	const handleLanguageChange = (value: string) => {
		setFormData((prev: any) => ({ ...prev, language: value }));
	};

	return (
		<>
			{/* Row 1: Name & Language */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="name"
						>
							Catalogue Name<span className="text-red-500 ml-1">*</span>
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => onInfoClick("catalog-name")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<div className="relative">
						<Input
							className={`border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base pr-10 ${
								type === "create" && errors?.name
									? "border-red-500 focus:border-red-500"
									: formData.name &&
											!nameExists &&
											touched?.name &&
											type === "create"
										? "border-green-500 focus:border-green-500"
										: ""
							}`}
							disabled={type === "edit" ? true : false}
							id="name"
							name="name"
							onChange={handleNameChange}
							placeholder="e.g. Burger House"
							required
							type="text"
							value={formData.name}
						/>
						{formData.name && touched?.name && type === "create" && (
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
								{errors?.name ? (
									<AlertCircle className="h-4 w-4 text-red-500" />
								) : (
									<CheckCircle className="h-4 w-4 text-green-500" />
								)}
							</div>
						)}
					</div>
					{formData.name &&
						!errors?.name &&
						touched?.name &&
						type === "create" && (
							<div className="text-green-600 text-sm mt-2 p-2 bg-green-50 border border-green-200 rounded-lg font-body flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								Great! This name is available.
							</div>
						)}
					{type === "create" && touched?.name && errors?.name && (
						<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							{errors.name}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-3">
					<Label
						className="text-product-foreground font-medium font-body"
						htmlFor="language"
					>
						Language<span className="text-red-500 ml-1">*</span>
					</Label>
					<Select
						onValueChange={handleLanguageChange}
						value={formData.language}
					>
						<SelectTrigger className="bg-product-background border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_OPTIONS.map((lang) => (
								<SelectItem key={lang.code} value={lang.code}>
									{lang.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{touched?.language && errors?.language && (
						<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
							{errors.language}
						</div>
					)}
				</div>
			</div>

			{/* Row 2: Heading */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Label
						className="text-product-foreground font-medium font-body"
						htmlFor="heading"
					>
						Catalogue Heading<span className="text-red-500 ml-1">*</span>
					</Label>
					<button
						className="hover:text-product-primary transition-colors duration-200 z-10"
						onClick={() => onInfoClick("catalog-heading")}
						type="button"
					>
						<FiInfo size={16} />
					</button>
				</div>
				<Input
					className="border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base"
					id="heading"
					name="heading"
					onChange={handleInputChange}
					placeholder="e.g. Our Delicious Menu"
					type="text"
					value={formData.heading || ""}
				/>
				{touched?.heading && errors?.heading && (
					<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
						{errors.heading}
					</div>
				)}
			</div>
		</>
	);
};

export default BasicInfoFields;
