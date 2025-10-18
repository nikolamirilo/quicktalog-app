"use client";
import { useUser } from "@clerk/nextjs";
import React, { useState } from "react";
import LimitsModal from "@/components/modals/LimitsModal";
import { Card, CardContent } from "@/components/ui/card";
import { revalidateData } from "@/helpers/server";
import { generateUniqueSlug } from "@/shared";
import { UserData } from "@/types";
import FormHeader from "./components/FormHeader";
import { LanguageSelector } from "./components/LanguageSelector";
import OcrReader from "./components/OcrReader";
import Step1General from "./components/steps/Step1General";
import ThemeSelect from "./components/ThemeSelect";

export default function OCRBuilder({ userData }: { userData: UserData }) {
	const [formData, setFormData] = useState({
		name: "",
		theme: "theme-elegant",
		title: "",
		currency: "",
		subtitle: "",
		language: "eng",
	});
	const [extractedText, setExtractedText] = useState("");
	const { user } = useUser();
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showLimitsModal, setShowLimitsModal] = useState(false);

	const handleInputChange = (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validate = () => {
		const newErrors: { [key: string]: string } = {};
		const hasErrors = Object.keys(errors).length > 0;
		if (!formData.name.trim()) newErrors.name = "Catalogue Name is required";
		if (!formData.title.trim())
			newErrors.title = "Catalogue Heading is required";
		if (!formData.currency.trim()) newErrors.currency = "Currency is required";
		if (!formData.theme.trim()) newErrors.theme = "Theme is required";
		if (!formData.language.trim()) newErrors.language = "Language is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0 && !hasErrors;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		if (!extractedText.trim()) {
			return;
		}

		if (!user || !user.id) {
			console.log("Issue with fetching user data");
			return;
		}

		setIsSubmitting(true);
		try {
			if (
				userData.usage.prompts >= userData.currentPlan.features.ai_prompts ||
				userData.usage.catalogues >= userData.currentPlan.features.catalogues
			) {
				setShowLimitsModal(true);
				setIsSubmitting(false);
				return;
			}

			const slug = generateUniqueSlug(formData.name);
			const data = { ...formData, name: slug };
			try {
				const response = await fetch("/api/items/ocr", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ocr_text: extractedText, formData: data }),
				});

				if (response.ok) {
					await response.json();
				} else {
					const errorData = await response.json();
					console.error("Error response:", errorData);
				}
			} catch (error) {
				console.error("Error submitting OCR data:", error);
			} finally {
				setIsSubmitting(false);
				await revalidateData();
			}
		} catch (error) {
			console.error("Submission error:", error);
		} finally {
			setIsSubmitting(false);
			await revalidateData();
		}
	};

	const handleLanguageChange = (value: string) => {
		setFormData((prev: any) => ({ ...prev, language: value }));
	};

	return (
		<div className="w-full max-w-4xl mx-auto bg-product-background/95 border border-product-border shadow-md rounded-3xl my-24 md:my-16">
			<Card
				className="w-full h-full bg-transparent border-0 shadow-none rounded-none backdrop-blur-none"
				type="form"
			>
				<FormHeader
					subtitle="Easily convert your physical catalogs into digital format in seconds. Perfect for restaurants, salons, gyms, and other businesses looking to modernize and streamline customer access."
					title="Scan & Import your catalogue"
				/>
				<CardContent className="p-6 sm:p-8 pt-0">
					<form className="space-y-6" onSubmit={handleSubmit}>
						<Step1General
							errors={errors}
							formData={formData}
							handleInputChange={handleInputChange}
							setErrors={setErrors}
							setFormData={setFormData}
							setTouched={setTouched}
							touched={touched}
							type="create"
						/>
						<ThemeSelect formData={formData} setFormData={setFormData} />
						<LanguageSelector
							errors={errors}
							onLanguageChange={handleLanguageChange}
							selectedLanguage={formData.language}
							touched={touched}
						/>

						<OcrReader
							extractedText={extractedText}
							formData={formData}
							isSubmitting={isSubmitting}
							onSubmit={handleSubmit}
							setExtractedText={setExtractedText}
						/>
					</form>
				</CardContent>
			</Card>
			{showLimitsModal && (
				<LimitsModal
					currentPlan={userData?.currentPlan}
					isOpen={showLimitsModal}
					requiredPlan={userData?.nextPlan}
					type="ocr"
				/>
			)}
		</div>
	);
}
