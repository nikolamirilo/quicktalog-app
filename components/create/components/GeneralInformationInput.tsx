"use client";
import InformModal from "@/components/modals/InformModal";
import { Card } from "@/components/ui/card";
import type { GeneralInformationInputProps } from "@/types/shared";
import { generateUniqueSlug } from "@quicktalog/common";
import { FileText, Link2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import BasicInfoFields from "./general/BasicInfoFields";
import CategorySetup from "./general/CategorySetup";

const GeneralInformationInput: React.FC<GeneralInformationInputProps> = ({
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
			"catalog-heading":
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

			<div className="space-y-6">
				<BasicInfoFields
					errors={errors}
					formData={formData}
					handleInputChange={handleInputChange}
					onInfoClick={handleInfoClick}
					setErrors={setErrors}
					setFormData={setFormData}
					setTouched={setTouched}
					touched={touched}
					type={type}
				/>

				{/* Row 3: Currency & Business Type */}
				<CategorySetup
					errors={errors}
					formData={formData}
					setFormData={setFormData}
					touched={touched}
					type={type}
				/>
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
					.replace(/\b\w/g, (l) => l.toUpperCase())} Explained`}
			/>
		</Card>
	);
};

export default GeneralInformationInput;
