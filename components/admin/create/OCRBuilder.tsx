"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState } from "react";
import { sendNewCatalogueEmail } from "@/actions/email";
import LimitsModal from "@/components/modals/LimitsModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Card, CardContent } from "@/components/ui/card";
import { generateUniqueSlug } from "@/helpers/client";
import { revalidateData } from "@/helpers/server";
import { toast } from "@/hooks/use-toast";
import { UserData } from "@/types";
import FormHeader from "./components/FormHeader";
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
	const [shouldGenerateImages, setShouldGenerateImages] =
		useState<boolean>(false);
	console.log(shouldGenerateImages);
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
		if (!formData.name.trim()) newErrors.name = "Catalogue Name is required.";
		if (!formData.title.trim())
			newErrors.title = "Catalogue Heading is required";
		if (!formData.currency.trim()) newErrors.currency = "Currency is required";
		if (!formData.theme.trim()) newErrors.theme = "Theme is required";
		if (!prompt.trim()) newErrors.prompt = "Items description is required.";
		setErrors(newErrors);
		setTouched({
			name: true,
			title: true,
			currency: true,
			theme: true,
			prompt: true,
		});
		return Object.keys(newErrors).length === 0 && !hasErrors;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!validate()) return;

		if (!user || !user.id) {
			toast({
				title: "Authentication Error",
				description: "You must be signed in to create a service catalogue.",
				variant: "destructive",
			});
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
				toast({
					title: "Success!",
					description: (
						<p>
							Your digital showcase has been created. You can view it at{" "}
							<Link
								className="text-primary-accent hover:underline"
								href={catalogueUrl}
							>
								{catalogueUrl}
							</Link>
						</p>
					),
				});
			} else {
				const errorData = await response.json();
				toast({
					title: "Error",
					description: `Failed to create showcase: ${errorData.error || "Unknown error"}`,
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Submission error:", error);
			toast({
				title: "Error",
				description: "An error occurred while submitting the request.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
			setShouldGenerateImages(false);
			await revalidateData();
		}
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

						<ThemeSelect
							errors={errors}
							formData={formData}
							setFormData={setFormData}
							touched={touched}
						/>

						<OcrReader
							formData={formData}
							setServiceCatalogueUrl={setCatalogueUrl}
							setShowSuccessModal={setShowSuccessModal}
						/>
					</form>
				</CardContent>
			</Card>

			<SuccessModal
				catalogueUrl={catalogueUrl}
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				type="ocr"
			/>
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
