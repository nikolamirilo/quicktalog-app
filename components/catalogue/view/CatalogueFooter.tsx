"use client";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { newsletterSignup } from "@/server_actions/newsletter";
import { CatalogueFooterProps } from "@/types/components";
import React, { useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import SmartLink from "../../general/SmartLink";
import Brand from "./components/Brand";
import CompanyInfo from "./components/CompanyInfo";
import Contact from "./components/Contact";
import DefaultActions from "./components/DefaultActions";
import Features from "./components/Features";
import LegalLinks from "./components/LegalLinks";
import Newsletter from "./components/Newsletter";
import Partners from "./components/Partners";

const CatalogueFooter: React.FC<CatalogueFooterProps> = ({
	type = "default",
	data,
	logo,
}) => {
	const { catalogue } = useCatalogueContext();
	const activeData = catalogue?.name ? catalogue : data;
	const [newsletterEmail, setNewsletterEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsSubmitting(true);
		setSubmitError("");
		setSubmitSuccess(false);

		try {
			await newsletterSignup(
				newsletterEmail,
				activeData?.id,
				activeData?.source,
			);
			setNewsletterEmail("");
			setSubmitSuccess(true);
			setTimeout(() => setSubmitSuccess(false), 3000);
		} catch (error: any) {
			console.error("Newsletter signup failed:", error);
			const message =
				error?.message ||
				error?.response?.activeData?.message ||
				"Failed to subscribe. Please try again.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getEffectiveSocials = () => {
		if (
			activeData?.contact?.socials &&
			Array.isArray(activeData.contact.socials)
		) {
			const links: Record<string, string> = {};
			activeData.contact.socials.forEach((url, i) => {
				if (!url) return;
				let platform = "link";
				const lowerUrl = url.toLowerCase();
				if (lowerUrl.includes("instagram")) platform = "instagram";
				else if (lowerUrl.includes("facebook")) platform = "facebook";
				else if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com"))
					platform = "twitter";
				else if (lowerUrl.includes("linkedin")) platform = "linkedin";
				else if (lowerUrl.includes("tiktok")) platform = "tiktok";
				else if (lowerUrl.includes("youtube")) platform = "youtube";
				else if (lowerUrl.includes("pinterest")) platform = "pinterest";
				else platform = `link-${i}`;

				if (!links[platform]) links[platform] = url;
			});
			return links;
		}
		return {};
	};

	const effectiveSocials = getEffectiveSocials();

	return (
		<footer
			aria-label={`${type === "default" ? "Quicktalog" : activeData?.legal?.legalName || "Custom"} footer`}
			className="border-t mt-auto font-body font-weight-body bg-catalogue-navigation-background text-catalogue-navigation-text border-catalogue-navigation-border"
			role="contentinfo"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
						{logo && (
							<Brand
								activeData={activeData}
								effectiveSocials={effectiveSocials}
								logo={logo}
								type={type}
							/>
						)}

						{(type === "default" || activeData?.contact?.email) && (
							<Contact activeData={activeData} type={type} />
						)}

						<div className="space-y-6">
							{type === "default" ? (
								<Features />
							) : (
								<CompanyInfo activeData={activeData} />
							)}
						</div>

						<div className="space-y-6">
							{type === "default" ? (
								<DefaultActions />
							) : (
								<Partners activeData={activeData} />
							)}
						</div>
					</div>
				</div>

				<div className="border-t py-6 border-catalogue-navigation-border">
					<div
						className={`flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-catalogue-navigation-text ${data.footer.newsletter ? "md:justify-between" : "md:justify-center"}`}
					>
						<span>
							© {new Date().getFullYear()}{" "}
							{type === "default"
								? "Quicktalog"
								: activeData?.legal?.legalName || "Your Company"}
							. All rights reserved.
						</span>
						<LegalLinks activeData={activeData} type={type} />

						{type === "custom" && activeData?.footer.newsletter && (
							<Newsletter
								handleNewsletterSubmit={handleNewsletterSubmit}
								isSubmitting={isSubmitting}
								newsletterEmail={newsletterEmail}
								setNewsletterEmail={setNewsletterEmail}
								submitError={submitError}
								submitSuccess={submitSuccess}
							/>
						)}

						{type === "custom" &&
							activeData?.footer?.cta?.isEnabled &&
							activeData?.footer?.cta?.url && (
								<Button
									asChild
									className="font-heading tracking-heading min-w-[50%] max-w-[96%] sm:min-w-fit lg:w-fit text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-catalogue-card-background text-foreground border-primary flex items-center gap-2"
									size="default"
									variant="outline"
								>
									<SmartLink
										aria-label={activeData?.footer?.cta?.label}
										href={activeData?.footer?.cta?.url || ""}
									>
										<FiExternalLink className="w-4 h-4" />
										{activeData?.footer?.cta?.label}
									</SmartLink>
								</Button>
							)}
					</div>
				</div>
			</div>
		</footer>
	);
};

export default CatalogueFooter;
