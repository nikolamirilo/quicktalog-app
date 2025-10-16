"use client";
import { Plus, Tag, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { IoDiamondOutline } from "react-icons/io5";
import CTASection from "@/components/common/CTASection";
import ImageDropzone from "@/components/common/ImageDropzone";
import InformModal from "@/components/modals/InformModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { contactTypes } from "@/constants";
import { Partner } from "@/types";
import type { Step4BrandingProps } from "@/types/components";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-]{7,15}$/;
const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/;

const Step4Branding: React.FC<Step4BrandingProps> = ({
	formData,
	userData,
	setIsUploading,
	handleAddContact,
	handleRemoveContact,
	handleContactChange,
	setFormData,
	errors,
	setErrors,
}) => {
	const isFreePlan = userData?.currentPlan.id === 0;
	const isProPlan = userData?.currentPlan.id === 1;
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [currentField, setCurrentField] = useState("");

	useEffect(() => {
		const newErrors: { [key: string]: string } = {};

		formData.partners?.forEach((partner, index) => {
			if (!partner.name.trim()) {
				newErrors[`partner-name-${index}`] =
					"Partner Catalogue Name is required";
			}
			if (!partner.url.trim()) {
				newErrors[`partner-url-${index}`] = "Partner URL is required";
			} else if (!urlRegex.test(partner.url)) {
				newErrors[`partner-url-${index}`] = "Invalid URL format";
			}
		});

		if (formData.configuration?.ctaFooter?.enabled) {
			if (!formData.configuration.ctaFooter.label?.trim()) {
				newErrors["ctaFooter-label"] = "Footer Button Label is required";
			}
			if (!formData.configuration.ctaFooter.url?.trim()) {
				newErrors["ctaFooter-url"] = "Footer Button URL is required";
			} else if (!urlRegex.test(formData.configuration.ctaFooter.url)) {
				newErrors["ctaFooter-url"] = "Invalid URL format";
			}
		}

		if (formData.configuration?.ctaNavbar?.enabled) {
			if (!formData.configuration.ctaNavbar.label?.trim()) {
				newErrors["ctaNavbar-label"] = "Navbar Button Label is required";
			}
			if (!formData.configuration.ctaNavbar.url?.trim()) {
				newErrors["ctaNavbar-url"] = "Navbar Button URL is required";
			} else if (!urlRegex.test(formData.configuration.ctaNavbar.url)) {
				newErrors["ctaNavbar-url"] = "Invalid URL format";
			}
		}

		formData.contact?.forEach((contact, index) => {
			if (!contact.value.trim()) {
				newErrors[`contact-value-${index}`] = `${contact.type} cannot be empty`;
			} else {
				if (contact.type === "email" && !emailRegex.test(contact.value)) {
					newErrors[`contact-value-${index}`] = "Invalid email format";
				}
				if (contact.type === "phone" && !phoneRegex.test(contact.value)) {
					newErrors[`contact-value-${index}`] = "Invalid phone number format";
				}
				if (
					["website", "facebook", "twitter", "instagram", "tiktok"].includes(
						contact.type,
					) &&
					!urlRegex.test(contact.value)
				) {
					newErrors[`contact-value-${index}`] =
						`Invalid ${contact.type} URL format`;
				}
			}
		});

		if (
			formData.legal?.terms_and_conditions &&
			!urlRegex.test(formData.legal.terms_and_conditions)
		) {
			newErrors["terms-and-conditions"] =
				"Invalid Terms & Conditions URL format";
		}
		if (
			formData.legal?.privacy_policy &&
			!urlRegex.test(formData.legal.privacy_policy)
		) {
			newErrors["privacy-policy"] = "Invalid Privacy Policy URL format";
		}

		setErrors(newErrors);
	}, [formData, setErrors]);

	const handleCtaChange = (
		ctaType: "ctaFooter" | "ctaNavbar",
		field: "url" | "label",
		value: string,
	) => {
		setFormData((prev) => ({
			...prev,
			configuration: {
				...prev.configuration,
				[ctaType]: {
					...prev.configuration?.[ctaType],
					[field]: value,
				},
			},
		}));
	};

	const handleToggle = (name: "ctaFooter" | "ctaNavbar" | "newsletter") => {
		setFormData((prev) => {
			if (name === "newsletter") {
				return {
					...prev,
					configuration: {
						...prev.configuration,
						newsletter: {
							enabled: !prev.configuration?.newsletter?.enabled,
						},
					},
				};
			} else {
				const isCurrentlyEnabled = prev.configuration?.[name]?.enabled || false;
				return {
					...prev,
					configuration: {
						...prev.configuration,
						[name]: {
							enabled: !isCurrentlyEnabled,
							label: prev.configuration?.[name]?.label || "",
							url: prev.configuration?.[name]?.url || "",
						},
					},
				};
			}
		});
	};

	const handleLegalInfoChange = (
		field: "name" | "terms_and_conditions" | "privacy_policy" | "address",
		value: string,
	) => {
		setFormData((prev) => ({
			...prev,
			legal: {
				...prev.legal,
				[field]: value,
			},
		}));
	};

	const handleAddPartner = () => {
		if ((formData.partners?.length || 0) < 3) {
			setFormData((prev) => ({
				...prev,
				partners: [
					...(prev.partners || []),
					{ name: "", description: "", logo: "", rating: 0, url: "" },
				],
			}));
		}
	};

	const handleRemovePartner = (index: number) => {
		setFormData((prev) => ({
			...prev,
			partners: prev.partners?.filter((_, i) => i !== index),
		}));
	};

	const handlePartnerChange = (
		index: number,
		field: keyof Partner,
		value: string,
	) => {
		setFormData((prev) => ({
			...prev,
			partners: prev.partners?.map((partner, i) =>
				i === index ? { ...partner, [field]: value } : partner,
			),
		}));
	};

	const handleLogoUpload = (url: string) => {
		setFormData((prev) => ({ ...prev, logo: url }));
		setIsUploading(false);
	};

	const handleLogoRemove = () => {
		setFormData((prev) => ({ ...prev, logo: "" }));
	};

	const usedContactTypes = formData.contact?.map((c) => c.type) || [];

	const getFieldExplanation = (
		field: string,
	): { message: string; image?: string; imageAlt?: string } => {
		const explanations: {
			[key: string]: { message: string; image?: string; imageAlt?: string };
		} = {
			"define-branding": {
				message:
					"This step allows you to customize your catalogue's branding and business information. You can add your logo, business details, contact information, legal links, and call-to-action buttons. This helps make your catalogue look professional and trustworthy while providing visitors with all the information they need to contact you or learn more about your business.",
			},
			"legal-name": {
				message:
					"This is your business's legal name that will appear in the footer of your catalogue. It helps establish credibility and provides official business information to visitors.",
			},
			"legal-address": {
				message:
					"Your business address will be displayed in the footer section of your catalogue. This helps visitors know your physical location and adds trust to your business.",
			},
			"terms-and-conditions": {
				message:
					"A link to your terms and conditions page. This will appear in the footer of your catalogue and is important for legal compliance and user trust.",
			},
			"privacy-policy": {
				message:
					"A link to your privacy policy page. This will appear in the footer of your catalogue and is required for GDPR compliance and user data protection.",
			},
			logo: {
				message:
					"Your business logo will be displayed in the header of your catalogue, replacing the default Quicktalog logo. This helps with brand recognition and professional appearance.",
			},
			"footer-action-link": {
				message:
					"A call-to-action button that appears in the footer of your catalogue. This can direct visitors to contact you, book services, or visit your main website. The button will be prominently displayed at the bottom of your catalogue page.",
				image: "/screenshots/ctafooter.png",
				imageAlt:
					"Footer action link example showing a call-to-action button in the catalogue footer",
			},
			"header-action-link": {
				message:
					"A call-to-action button that appears in the header/navigation area of your catalogue. This provides easy access to important actions like booking or contacting you. The button will be visible at the top of your catalogue page.",
				image: "/screenshots/ctaheader.png",
				imageAlt:
					"Header action link example showing a call-to-action button in the catalogue header",
			},
			newsletter: {
				message:
					"Enables a newsletter signup form in the footer of your catalogue. This helps you collect email addresses for marketing and customer communication. The form will appear at the bottom of your catalogue page.",
				image: "/screenshots/newsletter.png",
				imageAlt:
					"Newsletter signup form example showing an email input field and subscribe button",
			},
			"contact-information": {
				message:
					"Contact details like email, phone, and social media links that will appear in the footer of your catalogue. This makes it easy for visitors to reach you. The contact information will be displayed with social media icons for easy access.",
				image: "/screenshots/socialicons.png",
				imageAlt:
					"Contact information example showing social media icons and contact details in the catalogue footer",
			},
			partners: {
				message:
					"Partner logos and information that will be displayed in the footer of your catalogue. This helps showcase business partnerships and adds credibility to your services. The trusted partners section will appear at the bottom of your catalogue.",
				image: "/screenshots/trustedpartners.png",
				imageAlt:
					"Trusted partners example showing partner logos and information in the catalogue footer",
			},
		};
		return explanations[field] || { message: "Information about this field." };
	};

	const handleInfoClick = (field: string) => {
		setCurrentField(field);
		setIsInfoModalOpen(true);
	};

	return (
		<Card className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-md rounded-2xl">
			<div className="flex items-center gap-3">
				<h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
					<IoDiamondOutline className="text-product-primary" size={28} />
					Define Branding
				</h2>
				<button
					className="hover:text-product-primary transition-colors duration-200 z-10"
					onClick={() => handleInfoClick("define-branding")}
					type="button"
				>
					<FiInfo size={20} />
				</button>
			</div>

			{isFreePlan && (
				<CTASection
					ctaLabel="Upgrade plan"
					subtitle="Publish your existing catalog, upgrade your plan, then edit it with new features."
					title="Unlock Branding"
					type="form"
				/>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="legal-name"
						>
							Legal Business Name
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("legal-name")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<Input
						className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
						disabled={isFreePlan}
						id="legal-name"
						name="legal.name"
						onChange={(e) => handleLegalInfoChange("name", e.target.value)}
						placeholder="e.g. Quicktalog Inc."
						value={formData.legal?.name || ""}
					/>

					<div className="flex items-center gap-2">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="address"
						>
							Business Address
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("legal-address")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<Input
						className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
						disabled={isFreePlan}
						id="address"
						name="legal.address"
						onChange={(e) => handleLegalInfoChange("address", e.target.value)}
						placeholder="e.g. 123 Main St, San Francisco, CA"
						value={formData.legal?.address || ""}
					/>

					<div className="flex items-center gap-2">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="terms-and-conditions"
						>
							Terms & Conditions Link
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("terms-and-conditions")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<Input
						className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
						disabled={isFreePlan}
						id="terms-and-conditions"
						name="terms-and-conditions"
						onChange={(e) =>
							handleLegalInfoChange("terms_and_conditions", e.target.value)
						}
						placeholder="e.g. https://mywebsite.com/terms"
						value={formData.legal?.terms_and_conditions || ""}
					/>
					{errors?.["terms-and-conditions"] && (
						<p className="text-red-500 text-sm">
							{errors["terms-and-conditions"]}
						</p>
					)}

					<div className="flex items-center gap-2">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="privacy-policy"
						>
							Privacy Policy Link
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("privacy-policy")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					<Input
						className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
						disabled={isFreePlan}
						id="privacy-policy"
						name="privacy-policy"
						onChange={(e) =>
							handleLegalInfoChange("privacy_policy", e.target.value)
						}
						placeholder="e.g. https://mywebsite.com/privacy"
						value={formData.legal?.privacy_policy || ""}
					/>
					{errors?.["privacy-policy"] && (
						<p className="text-red-500 text-sm">{errors["privacy-policy"]}</p>
					)}
				</div>

				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Label
							className="text-product-foreground font-medium font-body"
							htmlFor="logo"
						>
							Logo
						</Label>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("logo")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>

					<ImageDropzone
						disabled={isFreePlan}
						image={formData.logo}
						maxDim={512}
						onError={(error) => alert(`ERROR! ${error.message}`)}
						onUploadComplete={handleLogoUpload}
						removeImage={handleLogoRemove}
						setIsUploading={setIsUploading}
						type="logo"
					/>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label className="text-product-foreground font-medium font-body">
								Footer Action Link
							</Label>
							<button
								className="hover:text-product-primary transition-colors duration-200 z-10"
								onClick={() => handleInfoClick("footer-action-link")}
								type="button"
							>
								<FiInfo size={16} />
							</button>
						</div>
						<Switch
							checked={!!formData.configuration?.ctaFooter?.enabled}
							disabled={isFreePlan}
							onCheckedChange={() => handleToggle("ctaFooter")}
						/>
					</div>
					{formData.configuration?.ctaFooter?.enabled && (
						<div className="space-y-3">
							<Input
								className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
								onChange={(e) =>
									handleCtaChange("ctaFooter", "label", e.target.value)
								}
								placeholder="Label (e.g. Contact Us)"
								value={formData.configuration.ctaFooter.label || ""}
							/>
							{errors?.["ctaFooter-label"] && (
								<p className="text-red-500 text-sm">
									{errors["ctaFooter-label"]}
								</p>
							)}
							<Input
								className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
								onChange={(e) =>
									handleCtaChange("ctaFooter", "url", e.target.value)
								}
								placeholder="URL (e.g. https://mywebsite.com/contact)"
								value={formData.configuration.ctaFooter.url || ""}
							/>
							{errors?.["ctaFooter-url"] && (
								<p className="text-red-500 text-sm">
									{errors["ctaFooter-url"]}
								</p>
							)}
						</div>
					)}
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label className="text-product-foreground font-medium font-body">
								Header Action Link
							</Label>
							<button
								className="hover:text-product-primary transition-colors duration-200 z-10"
								onClick={() => handleInfoClick("header-action-link")}
								type="button"
							>
								<FiInfo size={16} />
							</button>
						</div>
						<Switch
							checked={!!formData.configuration?.ctaNavbar?.enabled}
							disabled={isFreePlan}
							onCheckedChange={() => handleToggle("ctaNavbar")}
						/>
					</div>
					{formData.configuration?.ctaNavbar?.enabled && (
						<div className="space-y-3">
							<Input
								className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
								onChange={(e) =>
									handleCtaChange("ctaNavbar", "label", e.target.value)
								}
								placeholder="Label (e.g. Book Now)"
								value={formData.configuration.ctaNavbar.label || ""}
							/>
							{errors?.["ctaNavbar-label"] && (
								<p className="text-red-500 text-sm">
									{errors["ctaNavbar-label"]}
								</p>
							)}
							<Input
								className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
								onChange={(e) =>
									handleCtaChange("ctaNavbar", "url", e.target.value)
								}
								placeholder="URL (e.g. https://mywebsite.com/page)"
								value={formData.configuration.ctaNavbar.url || ""}
							/>
							{errors?.["ctaNavbar-url"] && (
								<p className="text-red-500 text-sm">
									{errors["ctaNavbar-url"]}
								</p>
							)}
						</div>
					)}
				</div>

				<div className="space-y-3 md:col-span-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label className="text-product-foreground font-medium font-body">
								Newsletter
							</Label>
							<button
								className="hover:text-product-primary transition-colors duration-200 z-10"
								onClick={() => handleInfoClick("newsletter")}
								type="button"
							>
								<FiInfo size={16} />
							</button>
						</div>
						<Switch
							checked={!!formData.configuration?.newsletter?.enabled}
							disabled={isFreePlan ? isFreePlan : isProPlan ? isProPlan : false}
							onCheckedChange={() => handleToggle("newsletter")}
						/>
					</div>
				</div>

				<div className="space-y-6 col-span-full">
					<div className="flex items-center gap-3">
						<h3 className="text-xl font-bold text-product-foreground flex items-center gap-3 font-heading">
							<Tag className="h-6 w-6 text-product-primary" /> Contact
							Information
						</h3>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("contact-information")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					{formData.contact?.map((contact, index) => (
						<div
							className="flex items-end gap-3 p-4 bg-product-background/50 rounded-xl border border-product-border"
							key={`contact-${index}`}
						>
							<div className="flex-grow space-y-2">
								<Label className="sr-only" htmlFor={`contact-type-${index}`}>
									Contact Type
								</Label>
								<Select
									onValueChange={(value) =>
										handleContactChange(index, "type", value)
									}
									value={contact.type}
								>
									<SelectTrigger className="border-product-border focus:border-product-primary focus:ring-product-primary/20">
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{contactTypes.map((type) => (
											<SelectItem
												disabled={
													usedContactTypes.includes(type.value) &&
													contact.type !== type.value
												}
												key={type.value}
												value={type.value}
											>
												{type.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex-grow space-y-2">
								<Label className="sr-only" htmlFor={`contact-value-${index}`}>
									Contact Value
								</Label>
								{errors?.[`contact-value-${index}`] && (
									<p className="relative left-2 text-red-500 text-sm">
										{errors[`contact-value-${index}`]}
									</p>
								)}
								<Input
									className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
									id={`contact-value-${index}`}
									onChange={(e) =>
										handleContactChange(index, "value", e.target.value)
									}
									placeholder="Enter value"
									type="text"
									value={contact.value}
								/>
							</div>
							<Button
								className="h-10 w-10 hover:bg-red-600 hover:shadow-product-hover-shadow"
								onClick={() => handleRemoveContact(index)}
								size="icon"
								type="button"
								variant="destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
					<Button
						className="w-full py-3 text-base font-medium border-product-border hover:border-product-primary hover:bg-product-primary/5 transition-all duration-200"
						disabled={isFreePlan}
						onClick={handleAddContact}
						type="button"
						variant="outline"
					>
						<Plus className="mr-2 h-5 w-5" /> Add New Contact
					</Button>
				</div>

				<div className="space-y-6 col-span-full">
					<div className="flex items-center gap-3">
						<h3 className="text-xl font-bold text-product-foreground flex items-center gap-3 font-heading">
							<Tag className="h-6 w-6 text-product-primary" /> Partners
						</h3>
						<button
							className="hover:text-product-primary transition-colors duration-200 z-10"
							onClick={() => handleInfoClick("partners")}
							type="button"
						>
							<FiInfo size={16} />
						</button>
					</div>
					{formData.partners?.map((partner, index) => (
						<div
							className="flex flex-col gap-4 p-4 bg-product-background/50 rounded-xl border border-product-border"
							key={`partner-${index}`}
						>
							<div className="flex justify-end">
								<Button
									className="h-8 w-8"
									onClick={() => handleRemovePartner(index)}
									size="icon"
									type="button"
									variant="destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
							{partner.url && (
								<div className="relative mt-2 w-12 h-12 rounded-lg border-2 border-product-border overflow-hidden">
									<img
										alt="Partner Icon"
										className="w-full h-full object-cover"
										src={`https://logo.clearbit.com/${partner.url}`}
									/>
								</div>
							)}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`partner-name-${index}`}>Partner Name</Label>
									<Input
										id={`partner-name-${index}`}
										onChange={(e) =>
											handlePartnerChange(index, "name", e.target.value)
										}
										placeholder="Partner Name"
										value={partner.name}
									/>
									{errors?.[`partner-name-${index}`] && (
										<p className="text-red-500 text-sm">
											{errors[`partner-name-${index}`]}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor={`partner-url-${index}`}>Partner URL</Label>
									<Input
										id={`partner-url-${index}`}
										onChange={(e) =>
											handlePartnerChange(index, "url", e.target.value)
										}
										placeholder="https://partner.com"
										value={partner.url}
									/>
									{errors?.[`partner-url-${index}`] && (
										<p className="text-red-500 text-sm">
											{errors[`partner-url-${index}`]}
										</p>
									)}
								</div>
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor={`partner-description-${index}`}>
										Description
									</Label>
									<Input
										id={`partner-description-${index}`}
										onChange={(e) =>
											handlePartnerChange(index, "description", e.target.value)
										}
										placeholder="A short description of the partner."
										value={partner.description}
									/>
								</div>
							</div>
						</div>
					))}
					<Button
						className="w-full py-3 text-base font-medium border-product-border hover:border-product-primary hover:bg-product-primary/5 transition-all duration-200"
						disabled={isFreePlan || (formData.partners?.length || 0) >= 3}
						onClick={handleAddPartner}
						type="button"
						variant="outline"
					>
						<Plus className="mr-2 h-5 w-5" /> Add New Partner
					</Button>
				</div>
			</div>

			<InformModal
				cancelText=""
				confirmText="Got it!"
				image={getFieldExplanation(currentField).image}
				imageAlt={getFieldExplanation(currentField).imageAlt}
				isOpen={isInfoModalOpen}
				message={getFieldExplanation(currentField).message}
				onCancel={() => setIsInfoModalOpen(false)}
				onConfirm={() => setIsInfoModalOpen(false)}
				title={`${currentField.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Explained`}
			/>
		</Card>
	);
};

export default Step4Branding;
