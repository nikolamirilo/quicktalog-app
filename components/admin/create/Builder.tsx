"use client";
import { useUser } from "@clerk/nextjs";
import {
	CatalogueFormData,
	CategoryItem,
	generateUniqueSlug,
} from "@quicktalog/common";
import { ArrowLeft, ArrowRight, Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
import { MdOutlinePublishedWithChanges } from "react-icons/md";
import { sendNewCatalogueEmail } from "@/actions/email";
import EditFormMobileTabs from "@/components/admin/create/components/EditFormMobileTabs";
import EditFormSidebar from "@/components/admin/create/components/EditFormSidebar";
import Step1General from "@/components/admin/create/components/steps/Step1General";
import Step2Categories from "@/components/admin/create/components/steps/Step2Categories";
import Step3Items from "@/components/admin/create/components/steps/Step3Items";
import Step4Branding from "@/components/admin/create/components/steps/Step4Branding";
import Step5Appearance from "@/components/admin/create/components/steps/Step5Appearance";
import LimitsModal from "@/components/modals/LimitsModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { defaultCatalogueData } from "@/constants";
import { cleanValue, validateStepHelper } from "@/helpers/client";
import { revalidateCataloguesData } from "@/helpers/server";
import { NavigationGuard } from "@/hooks/useBeforeUnload";
import { ContactInfo } from "@/types";
import { BuilderProps } from "@/types/components";
import { LimitType } from "@/types/enums";

function Builder({ type, initialData, onSuccess, userData }: BuilderProps) {
	const [formData, setFormData] = useState<CatalogueFormData>(
		initialData || defaultCatalogueData,
	);
	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showLimitsModal, setShowLimitsModal] = useState<{
		isOpen: boolean;
		type: LimitType;
	}>({ isOpen: false, type: "catalogue" });
	const [serviceCatalogueUrl, setServiceCatalogueUrl] = useState("");
	const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>(
		{},
	);
	const [isUploading, setIsUploading] = useState(false);
	const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
	const [isDirty, setIsDirty] = useState(false);
	const [expandedItem, setExpandedItem] = useState<{
		categoryIndex: number;
		itemIndex: number;
	} | null>(null);
	const { user } = useUser();

	const handleStepChange = (step: number) => {
		if (step === currentStep) return;
		const isValid = validateStep(currentStep);
		if (!isValid) {
			alert("Solve validation errors in order to proceed");
			return;
		}
		setIsDirty(true);
		setCurrentStep(step);
	};

	// Sidebar button styling function
	const getSidebarButtonClass = (isActive: boolean) => {
		return isActive
			? "font-bold !bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform"
			: "font-medium";
	};

	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	useEffect(() => {
		if (
			userData.currentPlan.features.catalogues <= userData.usage.catalogues &&
			type == "create"
		) {
			setShowLimitsModal({ isOpen: true, type: "catalogue" });
		}
		if (
			userData.currentPlan.features.traffic_limit <=
				userData.usage.traffic.pageview_count &&
			type == "create"
		) {
			setShowLimitsModal({ isOpen: true, type: "traffic" });
		}
	}, []);

	const handleInputChange = (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setIsDirty(true);
	};
	const handleReorderCategories = (newOrder: CatalogueFormData["services"]) => {
		setFormData((prev) => ({
			...prev,
			services: newOrder,
		}));
	};
	const handleAddCategory = () => {
		const newCategoryIndex = formData.services.length;
		setFormData((prev) => ({
			...prev,
			services: [
				...prev.services,
				{ order: newCategoryIndex, name: "", layout: "variant_1", items: [] },
			],
		}));
		setExpandedCategory(newCategoryIndex);
	};

	const handleRemoveCategory = (categoryIndex: number) => {
		setFormData((prev) => {
			setImagePreviews((prevPreviews) => {
				const newPreviews = { ...prevPreviews };
				const deletedCategory = prev.services[categoryIndex];

				if (deletedCategory) {
					deletedCategory.items.forEach((_, itemIndex) => {
						delete newPreviews[`${categoryIndex}-${itemIndex}`];
					});
				}

				for (let i = categoryIndex + 1; i < prev.services.length; i++) {
					const currentCategory = prev.services[i];
					if (currentCategory && currentCategory.items) {
						currentCategory.items.forEach((_, itemIndex) => {
							const oldKey = `${i}-${itemIndex}`;
							const newKey = `${i - 1}-${itemIndex}`;
							if (newPreviews[oldKey]) {
								newPreviews[newKey] = newPreviews[oldKey];
								delete newPreviews[oldKey];
							}
						});
					}
				}

				return newPreviews;
			});

			const newServices = prev.services.filter(
				(_, index) => index !== categoryIndex,
			);
			const reorderedServices = newServices.map((category, index) => ({
				...category,
				order: index,
			}));

			return {
				...prev,
				services: reorderedServices,
			};
		});

		// Reset expanded states when a category is removed
		setExpandedCategory(null);
		setExpandedItem(null);
	};

	const handleCategoryChange = (
		index: number,
		field: "name" | "layout",
		value: string,
	) => {
		const updatedServices = [...formData.services];
		updatedServices[index][field] = value;
		if (field === "layout" && value === "variant_3") {
			updatedServices[index].items = updatedServices[index].items.map(
				(item) => ({
					...item,
					image: "",
				}),
			);
			setImagePreviews((prev) => {
				const newPreviews = { ...prev };
				updatedServices[index].items.forEach((_, itemIndex) => {
					delete newPreviews[`${index}-${itemIndex}`];
				});
				return newPreviews;
			});
		}
		setFormData((prev) => ({ ...prev, services: updatedServices }));
	};

	const handleAddItem = (categoryIndex: number) => {
		const updatedServices = [...formData.services];
		const newItemIndex = updatedServices[categoryIndex].items.length;
		updatedServices[categoryIndex].items = [
			...updatedServices[categoryIndex].items,
			{ name: "", description: "", price: "", image: "" },
		];
		setFormData((prev) => ({ ...prev, services: updatedServices }));
		setExpandedItem({ categoryIndex, itemIndex: newItemIndex });
		setExpandedCategory(categoryIndex);
	};

	const handleRemoveItem = (categoryIndex: number, itemIndex: number) => {
		const updatedServices = [...formData.services];
		updatedServices[categoryIndex].items = updatedServices[
			categoryIndex
		].items.filter((_, index) => index !== itemIndex);
		setFormData((prev) => ({ ...prev, services: updatedServices }));
		setExpandedItem(null);
		setImagePreviews((prev) => {
			const newPreviews = { ...prev };
			const itemsLength = updatedServices[categoryIndex].items.length;
			delete newPreviews[`${categoryIndex}-${itemIndex}`];

			for (let i = itemIndex; i < itemsLength; i++) {
				const currentKey = `${categoryIndex}-${i + 1}`;
				const newKey = `${categoryIndex}-${i}`;
				if (newPreviews[currentKey]) {
					newPreviews[newKey] = newPreviews[currentKey];
					delete newPreviews[currentKey];
				}
			}

			return newPreviews;
		});
	};

	const handleItemChange = (
		categoryIndex: number,
		itemIndex: number,
		field: keyof CategoryItem,
		value: string | number,
	) => {
		setFormData((prev) => {
			const newServices = prev.services.map((category, cIndex) => {
				if (cIndex !== categoryIndex) {
					return category;
				}
				return {
					...category,
					items: category.items.map((item, iIndex) => {
						if (iIndex !== itemIndex) {
							return item;
						}
						return {
							...item,
							[field]: value,
						};
					}),
				};
			});
			return { ...prev, services: newServices };
		});
		setIsDirty(true);
	};

	const handleAddContact = () => {
		setFormData((prev) => ({
			...prev,
			contact: [...prev.contact, { type: "", value: "" }],
		}));
	};

	const handleRemoveContact = (contactIndex: number) => {
		setFormData((prev) => ({
			...prev,
			contact: prev.contact.filter((_, index) => index !== contactIndex),
		}));
	};

	const handleContactChange = (
		index: number,
		field: keyof ContactInfo,
		value: string,
	) => {
		const updatedContact = [...formData.contact];
		updatedContact[index] = { ...updatedContact[index], [field]: value };
		setFormData((prev) => ({ ...prev, contact: updatedContact }));
		setIsDirty(true);
	};
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
	const [step2Error, setStep2Error] = useState<string>("");
	const [step3Error, setStep3Error] = useState<string>("");
	const steps = [1, 2, 3, 4, 5];

	const isStepValid = (step: number): boolean => {
		if (step === 1) {
			const hasErrors = Object.keys(errors).length > 0;
			const requiredFieldsFilled =
				!!formData.name.trim() &&
				!!formData.title?.trim() &&
				!!formData.currency?.trim();
			return !hasErrors && requiredFieldsFilled;
		}
		if (step === 2) {
			if (formData.services.length === 0) return false;
			const hasErrors = Object.keys(errors).length > 0;
			return (
				formData.services.every((category) => !!category.name.trim()) &&
				!hasErrors
			);
		}
		if (step === 3) {
			const hasErrors = Object.keys(errors).length > 0;
			return (
				formData.services.every((category) => category.items.length > 0) &&
				!hasErrors
			);
		}
		if (step === 4) {
			const hasErrors = Object.keys(errors).length > 0;
			return !hasErrors;
		}
		if (step === 5) {
			const hasErrors = Object.keys(errors).length > 0;
			return !!formData.theme.trim() && !hasErrors;
		}
		return true;
	};

	const validateStep = (step: number): boolean => {
		const result = validateStepHelper({
			step,
			formData,
		});
		setErrors(result.errors);
		if (result.step2Error) setStep2Error(result.step2Error);
		else setStep2Error("");
		if (result.step3Error) setStep3Error(result.step3Error);
		else setStep3Error("");
		return result.isValid;
	};

	const handleInputChangeWithValidation = (
		e:
			| React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
			| { target: { name: string; value: string } },
	) => {
		handleInputChange(e);
	};

	const handleNext = () => {
		if (validateStep(currentStep)) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		setCurrentStep((prev) => prev - 1);
	};

	const handleSubmit = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (!steps.every((step) => validateStep(step))) {
			console.error(
				"Please complete all steps and ensure all fields are valid.",
			);
			return;
		}

		if (!user || !user.id) {
			console.error(
				"You must be signed in to create or edit a service catalogue.",
			);
			setIsSubmitting(false);
			return;
		}

		setIsSubmitting(true);

		try {
			if (type === "create") {
				if (
					userData.usage.catalogues >= userData.currentPlan.features.catalogues
				) {
					setShowLimitsModal({ isOpen: true, type: "catalogue" });
					setIsSubmitting(false);
					return;
				}
				if (
					userData.usage.traffic.pageview_count >=
					userData.currentPlan.features.traffic_limit
				) {
					setShowLimitsModal({ isOpen: true, type: "traffic" });
					setIsSubmitting(false);
					return;
				}
			}

			const serviceCatalogueSlug =
				generateUniqueSlug(formData.name) || formData.name;

			const submissionData = {
				name: serviceCatalogueSlug,
				status: "active",
				theme: formData.theme,
				logo: formData.logo,
				title: formData.title,
				currency: formData.currency,
				contact: cleanValue(formData.contact),
				subtitle: formData.subtitle,
				services: formData.services,
				partners: cleanValue(formData.partners),
				legal: cleanValue(formData.legal),
				configuration: cleanValue(formData.configuration),
				created_by: user.id,
			};

			const method = type === "edit" ? "PATCH" : "POST";
			const response = await fetch("/api/items", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(submissionData),
			});

			console.log("Response status:", response.status);

			if (response.ok) {
				const responseData = await response.json();
				const finalSlug = responseData.slug || serviceCatalogueSlug;
				revalidateCataloguesData(finalSlug);
				setIsDirty(false);

				const catalogueUrl =
					responseData.catalogueUrl || `/catalogues/${finalSlug}`;
				setServiceCatalogueUrl(catalogueUrl);
				setShowSuccessModal(true);

				if (onSuccess) onSuccess(catalogueUrl);
				if (type === "create") {
					setFormData(defaultCatalogueData);
					setCurrentStep(1);
				}
			} else {
				const errorData = await response.json();
				console.error("Error response:", errorData);
			}
		} catch (error) {
			console.error("Submission error:", error);
		} finally {
			setIsSubmitting(false);
			setIsDirty(false);
		}
	};
	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<Step1General
						errors={errors}
						formData={formData}
						handleInputChange={handleInputChangeWithValidation}
						setErrors={setErrors}
						setFormData={setFormData}
						setTouched={setTouched}
						touched={touched}
						type={type}
					/>
				);
			case 2:
				return (
					<Step2Categories
						expandedCategory={expandedCategory}
						formData={formData}
						handleAddCategory={handleAddCategory}
						handleCategoryChange={handleCategoryChange}
						handleRemoveCategory={handleRemoveCategory}
						handleReorderCategories={handleReorderCategories}
						setExpandedCategory={setExpandedCategory}
						setShowLimitsModal={setShowLimitsModal}
						tier={userData.currentPlan}
					/>
				);
			case 3:
				return (
					<Step3Items
						expandedCategory={expandedCategory}
						expandedItem={expandedItem}
						formData={formData}
						handleAddItem={handleAddItem}
						handleItemChange={handleItemChange}
						handleRemoveItem={handleRemoveItem}
						imagePreviews={imagePreviews}
						isUploading={isUploading}
						setExpandedCategory={setExpandedCategory}
						setExpandedItem={setExpandedItem}
						setImagePreviews={setImagePreviews}
						setIsUploading={setIsUploading}
						setShowLimitsModal={setShowLimitsModal}
						tier={userData.currentPlan}
					/>
				);
			case 4:
				return (
					<Step4Branding
						errors={errors}
						formData={formData}
						handleAddContact={handleAddContact}
						handleContactChange={handleContactChange}
						handleRemoveContact={handleRemoveContact}
						setErrors={setErrors}
						setFormData={setFormData}
						setIsUploading={setIsUploading}
						userData={userData}
					/>
				);
			case 5:
				return (
					<Step5Appearance formData={formData} setFormData={setFormData} />
				);

			default:
				return null;
		}
	};

	return (
		<>
			{/* Sidebar Navigation (Desktop) */}
			{type === "edit" && (
				<EditFormSidebar
					currentStep={currentStep}
					getSidebarButtonClass={getSidebarButtonClass}
					onStepChange={handleStepChange}
				/>
			)}
			<NavigationGuard isDirty={isDirty} />

			{/* Main Content */}
			<div className="flex-1 w-full">
				{/* Mobile Tab Navigation */}
				{type === "edit" && (
					<EditFormMobileTabs
						currentStep={currentStep}
						onStepChange={handleStepChange}
					/>
				)}

				<div className="w-full max-w-4xl mx-auto bg-product-background/95 border border-product-border shadow-md rounded-3xl">
					<Card
						className="w-full h-full bg-transparent border-0 shadow-none rounded-none backdrop-blur-none"
						type="form"
					>
						<CardHeader className="p-6 sm:p-8">
							<CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-product-foreground font-heading">
								{type === "edit" ? "Edit Catalogue" : "Create Catalogue"}
							</CardTitle>
							<CardDescription className="text-center text-product-foreground-accent text-base sm:text-lg mt-2 font-body">
								Step {currentStep} of 5:{" "}
								{currentStep === 1
									? "General Information"
									: currentStep === 2
										? "Manage Categories"
										: currentStep === 3
											? "Manage Items"
											: currentStep === 4
												? "Branding & Contact"
												: "Choose Appearance"}
							</CardDescription>
							<div className="flex justify-center space-x-3 mt-6">
								{steps.map((step) => (
									<button
										className={`w-10 h-2 rounded-full transition-all duration-300 ${currentStep === step ? "bg-product-primary shadow-product-shadow cursor-pointer" : "bg-product-border cursor-not-allowed"}  hover:bg-product-primary/80 hover:shadow-product-hover-shadow`}
										disabled={currentStep === step ? false : true}
										key={step}
										onClick={async () => {
											if (step === currentStep) return;
											if (step < currentStep) {
												setCurrentStep(step);
											} else {
												let valid = true;
												for (let s = 1; s < step; s++) {
													if (!validateStep(s)) {
														valid = false;
														setCurrentStep(s);
														break;
													}
												}
												if (valid) setCurrentStep(step);
											}
										}}
										title={`Go to step ${step}`}
									/>
								))}
							</div>
						</CardHeader>
						<CardContent className="p-4 sm:p-4 pt-0">
							<form className="space-y-8">
								{renderStep()}
								{currentStep === 2 && step2Error && (
									<div className="text-red-500 text-center mt-4 p-3 bg-red-50 border border-red-200 rounded-lg font-body">
										{step2Error}
									</div>
								)}
								{currentStep === 3 && step3Error && (
									<div className="text-red-500 text-center mt-4 p-3 bg-red-50 border border-red-200 rounded-lg font-body">
										{step3Error}
									</div>
								)}
								<div className="flex flex-col sm:flex-row sm:justify-between gap-4 mt-8 pt-6 border-t border-product-border">
									{currentStep > 1 && (
										<Button
											className="px-6 py-3 text-base font-medium"
											onClick={handlePrevious}
											type="button"
											variant="outline"
										>
											<ArrowLeft className="mr-2 h-5 w-5" /> Previous
										</Button>
									)}
									{currentStep < 5 && (
										<Button
											className={`sm:ml-auto px-6 py-3 text-base font-medium ${!isStepValid(currentStep) || isUploading ? "bg-product-border text-product-foreground-accent hover:bg-product-border cursor-not-allowed" : "bg-product-primary hover:bg-product-primary-accent hover:shadow-product-hover-shadow hover:scale-[1.02] hover:transform hover:-translate-y-1"}`}
											disabled={!isStepValid(currentStep) || isUploading}
											onClick={handleNext}
											type="button"
										>
											Next <ArrowRight className="ml-2 h-5 w-5" />
										</Button>
									)}
									{currentStep === 5 && (
										<Button
											className="sm:ml-auto flex items-center justify-center px-8 py-3 text-base font-semibold bg-product-primary hover:bg-product-primary-accent hover:shadow-product-hover-shadow hover:scale-[1.02] hover:transform hover:-translate-y-1 transition-all duration-300"
											disabled={
												isSubmitting || !isStepValid(currentStep) || isUploading
											}
											onClick={handleSubmit}
										>
											{type === "create" ? (
												<MdOutlinePublishedWithChanges className="h-5 w-5" />
											) : (
												<Edit className="h-5 w-5" />
											)}
											{isSubmitting
												? type === "create"
													? "Publishing..."
													: "Saving..."
												: type === "create"
													? "Publish"
													: "Save Changes"}
										</Button>
									)}
								</div>
							</form>
						</CardContent>
						{showSuccessModal ? (
							<SuccessModal
								catalogueUrl={serviceCatalogueUrl}
								isOpen={showSuccessModal}
								onClose={() => setShowSuccessModal(false)}
								type={type === "edit" ? "edit" : "regular"}
							/>
						) : null}

						{showLimitsModal.isOpen && (
							<LimitsModal
								currentPlan={userData?.currentPlan}
								isOpen={showLimitsModal.isOpen}
								onClose={() =>
									setShowLimitsModal({ isOpen: false, type: "catalogue" })
								}
								requiredPlan={userData?.nextPlan}
								type={showLimitsModal.type}
							/>
						)}
					</Card>
				</div>
			</div>
		</>
	);
}
export default Builder;
