"use client";
import { generateUniqueSlug } from "@quicktalog/common";
import { AlertCircle, CheckCircle, FileText, Link2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { FiInfo } from "react-icons/fi";
import DescriptionEditor from "@/components/common/DescriptionEditor";
import InformModal from "@/components/modals/InformModal";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueName } from "@/hooks/useCatalogueName";
import type { Step1GeneralProps } from "@/types/components";
import { CurrencySelect } from "../CurrencySelect";

const Step1General: React.FC<Step1GeneralProps> = ({
	formData,
	handleInputChange,
	setFormData,
	errors = {},
	touched = {},
	setErrors,
	setTouched,
	type,
}) => {
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [currentField, setCurrentField] = useState("");
	const [previewUrl, setPreviewUrl] = useState("");

	const handleCurrencyChange = (value: string) => {
		setFormData((prev: any) => ({ ...prev, currency: value }));
	};
	const { handleNameChange, nameExists } = useCatalogueName({
		initialName: "name",
		type: "create",
		setFormData,
		setErrors,
		setTouched,
	});

	useEffect(() => {
		const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
		const slug = generateUniqueSlug(formData.name);
		setPreviewUrl(`${baseURL}/catalogues/${slug}`);
	}, [formData.name]);

	const getFieldExplanation = (field: string): string => {
		const explanations: { [key: string]: string } = {
			"general-information":
				"This step sets up the basic information for your catalogue. You'll define the catalogue name (used in the URL), heading, currency for pricing, and an optional description. The catalogue name must be unique and will be used to create your public URL. This information forms the foundation of your digital catalogue.",
			"catalog-name":
				"This is your catalog's unique identifier that appears in the URL (e.g., quicktalog.app/catalogues/your-catalog-name) and is displayed on your dashboard. It must be unique and can only contain letters, numbers, and spaces. This name helps you identify your catalog in the admin panel.",
			"catalog-title":
				"This is the main heading that visitors will see at the top of your catalog page. It's the prominent heading that introduces your services to customers and appears as the main heading on your public catalog page.",
		};
		return explanations[field] || "Information about this field.";
	};

	const handleInfoClick = (field: string) => {
		setCurrentField(field);
		setIsInfoModalOpen(true);
	};

	console.log(formData);

	return (
		<Card
			className="space-y-8 bg-product-background/95 border-0 border-product-border shadow-md rounded-2xl"
			type="form"
		>
			<div className="flex items-center gap-3">
				<h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
					<FileText className="text-product-primary" size={28} />
					General Information
				</h2>
				<button
					className="hover:text-product-primary transition-colors duration-200 z-10"
					onClick={() => handleInfoClick("general-information")}
					type="button"
				>
					<FiInfo size={20} />
				</button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
							onClick={() => handleInfoClick("catalog-name")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<div className="relative">
						<Input
							className={`border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base pr-10 ${
								errors?.name
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
						{/* Real-time validation icon - only show in create flow */}
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

					{/* Show success message when name is unique and touched - only in create flow */}
					{formData.name &&
						!errors?.name &&
						touched?.name &&
						type === "create" && (
							<div className="text-green-600 text-sm mt-2 p-2 bg-green-50 border border-green-200 rounded-lg font-body flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								Great! This name is available.
							</div>
						)}

					{/* Show all validation errors (including duplicate name error) */}
					{touched?.name && errors?.name && (
						<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body flex items-center gap-2">
							<AlertCircle className="h-4 w-4" />
							{errors.name}
						</div>
					)}

					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<Label
								className="text-product-foreground font-medium font-body"
								htmlFor="title"
							>
								Catalogue Heading<span className="text-red-500 ml-1">*</span>
							</Label>
							<button
								className="hover:text-product-primary transition-colors duration-200 z-10"
								onClick={() => handleInfoClick("catalog-title")}
								type="button"
							>
								<FiInfo size={16} />
							</button>
						</div>
						<Input
							className="border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base"
							id="title"
							name="title"
							onChange={handleInputChange}
							placeholder="e.g. Our Delicious Menu"
							type="text"
							value={formData.title || ""}
						/>
						{touched?.title && errors?.title && (
							<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
								{errors.title}
							</div>
						)}
					</div>

					<div className="flex flex-col gap-3">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="currency"
						>
							Currency<span className="text-red-500 ml-1">*</span>
						</Label>
						<CurrencySelect
							onChange={handleCurrencyChange}
							value={formData.currency}
						/>
						{touched?.currency && errors?.currency && (
							<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
								{errors.currency}
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col h-full gap-3">
					<Label
						className="text-product-foreground font-medium font-body"
						htmlFor="subtitle"
					>
						Catalogue Description
					</Label>
					<DescriptionEditor
						className="flex-1 border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base"
						name="subtitle"
						onChange={(e) => {
							handleInputChange(e);
						}}
						placeholder="Add a catchy intro for your catalogue"
						value={formData.subtitle}
					/>
				</div>
			</div>
			{type === "create" && formData.name != "" ? (
				<div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
					<div className="flex items-start gap-2">
						<Link2 className="text-product-primary" size={25} />
						<div className="flex-1 min-w-0">
							<p className="text-sm text-product-foreground font-medium mb-1">
								Your catalogue URL will be:
							</p>
							<p className="text-sm text-product-primary font-mono break-all">
								{previewUrl}
							</p>
						</div>
					</div>
				</div>
			) : null}
			<InformModal
				confirmText="Got it!"
				isOpen={isInfoModalOpen}
				message={getFieldExplanation(currentField)}
				onConfirm={() => setIsInfoModalOpen(false)}
				title={`${currentField
					.replace(/-/g, " ")
					.replace(/\b\w/g, (l) => l.toUpperCase())
					.replace("Catalog Title", "Catalog Heading")} Explained`}
			/>
		</Card>
	);
};

export default Step1General;
