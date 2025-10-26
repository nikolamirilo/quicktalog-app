"use client";
import { useUser } from "@clerk/nextjs";
import { generateUniqueSlug } from "@quicktalog/common";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { IoTimerOutline } from "react-icons/io5";
import InformModal from "@/components/modals/InformModal";
import LimitsModal from "@/components/modals/LimitsModal";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { revalidateData } from "@/helpers/server";
import { UserData } from "@/types";
import FormHeader from "./components/FormHeader";
import { LanguageSelector } from "./components/LanguageSelector";
import OCRImport from "./components/OCRImport";
import Step1General from "./components/steps/Step1General";
import ThemeSelect from "./components/ThemeSelect";

export default function OCRBuilder({
	userData,
	api_url,
}: {
	userData: UserData;
	api_url: string;
}) {
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
	const [shouldGenerateImages, setShouldGenerateImages] =
		useState<boolean>(false);
	const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
	const router = useRouter();

	const handleInputChange = (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validateForm = (): boolean => {
		const newErrors: { [key: string]: string } = {};

		if (!formData.name.trim()) {
			newErrors.name = "Catalogue Name is required";
		}
		if (!formData.title.trim()) {
			newErrors.title = "Catalogue Heading is required";
		}
		if (!formData.currency.trim()) {
			newErrors.currency = "Currency is required";
		}
		if (!formData.theme.trim()) {
			newErrors.theme = "Theme is required";
		}
		if (!formData.language.trim()) {
			newErrors.language = "Language is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	function checkValidity() {
		if (!validateForm()) {
			alert("Please fill in all required fields before importing.");
			return false;
		}

		if (!user || !user.id) {
			console.error("User data not available");
			alert("User authentication error. Please try logging in again.");
			return false;
		}
		if (
			userData.usage.prompts >= userData.currentPlan.features.ai_prompts ||
			userData.usage.catalogues >= userData.currentPlan.features.catalogues
		) {
			setShowLimitsModal(true);
			return false;
		}

		setIsSubmitting(true);
		return true;
	}

	const handleExtractComplete = async (text: string) => {
		try {
			const slug = generateUniqueSlug(formData.name);
			const data = { ...formData, name: slug };

			fetch(`${api_url}/api/ocr`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					input_text: text,
					formData: data,
					shouldGenerateImages: shouldGenerateImages,
					userId: user.id,
				}),
			});

			setShowInfoModal(true);
			await revalidateData();
		} catch (error) {
			console.error("Error submitting OCR data:", error);
			alert("An error occurred while submitting. Please try again.");
		} finally {
			setIsSubmitting(false);
			setShouldGenerateImages(false);
		}
	};

	const handleLanguageChange = (value: string) => {
		setFormData((prev) => ({ ...prev, language: value }));
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
					<div className="space-y-6">
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

						<div className="flex items-center gap-2">
							<Label className="text-sm text-product-foreground font-medium">
								Generate Images?
							</Label>
							<Switch
								checked={shouldGenerateImages}
								className="bg-blue-500"
								onCheckedChange={() =>
									setShouldGenerateImages(!shouldGenerateImages)
								}
							/>
						</div>

						<OCRImport
							checkValidity={checkValidity}
							extractedText={extractedText}
							formData={formData}
							isSubmitting={isSubmitting}
							onExtractComplete={handleExtractComplete}
							setExtractedText={setExtractedText}
						/>
					</div>
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

			{showInfoModal && (
				<InformModal
					confirmText="Go to Dashboard"
					icon={<IoTimerOutline color="#ffc107" size={30} />}
					isOpen={showInfoModal}
					message="Your import has started and will complete in about 5 minutes. You can return to the dashboard shortly to find your catalogue ready."
					onConfirm={() => {
						router.push("/admin/dashboard");
					}}
					title="OCR import has started"
				/>
			)}
		</div>
	);
}
