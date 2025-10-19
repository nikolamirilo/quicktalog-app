"use client";
import { useUser } from "@clerk/nextjs";
import { generateUniqueSlug } from "@quicktalog/common";
import React, { useState } from "react";
import { RiSparkling2Line } from "react-icons/ri";
import { sendNewCatalogueEmail } from "@/actions/email";
import LimitsModal from "@/components/modals/LimitsModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { revalidateData } from "@/helpers/server";
import { UserData } from "@/types";
import FormHeader from "./components/FormHeader";
import { LanguageSelector } from "./components/LanguageSelector";
import PromptExamples from "./components/PromptExamples";
import PromptInput from "./components/PromptInput";
import Step1General from "./components/steps/Step1General";
import ThemeSelect from "./components/ThemeSelect";

export default function AIBuilder({ userData }: { userData: UserData }) {
	const [formData, setFormData] = useState({
		name: "",
		theme: "theme-elegant",
		title: "",
		currency: "",
		subtitle: "",
		language: "eng",
	});
	const [shouldGenerateImages, setShouldGenerateImages] =
		useState<boolean>(false);
	const [prompt, setPrompt] = useState("");
	const { user } = useUser();
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [catalogueUrl, setCatalogueUrl] = useState("");
	const [showSuccessModal, setShowSuccessModal] = useState(false);
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
		if (!prompt.trim()) newErrors.prompt = "Prompt is required";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0 && !hasErrors;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		if (!user || !user.id) {
			console.log("Issue with fetching user data");
			return;
		}

		setIsSubmitting(true);
		setCatalogueUrl("");
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

			const response = await fetch("/api/items/ai", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ formData: data, prompt, shouldGenerateImages }),
			});

			const contactData = {
				email: user.emailAddresses[0]?.emailAddress || "",
				name: user.firstName || "",
			};

			if (response.ok) {
				const { catalogueUrl, slug } = await response.json();
				setCatalogueUrl(catalogueUrl);
				await sendNewCatalogueEmail(contactData, formData.name, slug);
				setShowSuccessModal(true);
			} else {
				const errorData = await response.json();
				console.error(errorData);
			}
		} catch (error) {
			console.error("Submission error:", error);
		} finally {
			setIsSubmitting(false);
			setShouldGenerateImages(false);
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
					subtitle="Generate stunning catalogues in minutes. Perfect for restaurants, salons, gyms, and more."
					title="AI Catalogue Generator"
				/>
				<CardContent className="p-6 sm:p-8 pt-0">
					<form className="space-y-6">
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

						<PromptInput
							errors={errors}
							prompt={prompt}
							setPrompt={setPrompt}
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

						<Button
							className="h-12 font-medium rounded-lg"
							disabled={isSubmitting}
							onClick={handleSubmit}
							variant="cta"
						>
							{isSubmitting ? (
								<div className="flex items-center gap-2 animate-pulse">
									<RiSparkling2Line className="animate-spin" size={20} />
									Creating Your Catalogue...
								</div>
							) : (
								<div className="flex items-center gap-2">
									<RiSparkling2Line size={20} />
									Generate Catalogue
								</div>
							)}
						</Button>
					</form>
					<PromptExamples disabled={isSubmitting} setPrompt={setPrompt} />
				</CardContent>
			</Card>

			<SuccessModal
				catalogueUrl={catalogueUrl}
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				type="ai"
			/>
			{showLimitsModal && (
				<LimitsModal
					currentPlan={userData?.currentPlan}
					isOpen={showLimitsModal}
					requiredPlan={userData?.nextPlan}
					type="ai"
				/>
			)}
		</div>
	);
}
