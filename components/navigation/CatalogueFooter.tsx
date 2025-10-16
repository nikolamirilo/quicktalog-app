"use client";
import Link from "next/link";
import React, { useState } from "react";
import {
	FiCheck,
	FiExternalLink,
	FiMail,
	FiMapPin,
	FiPhone,
	FiPlus,
} from "react-icons/fi";
import { MdTitle } from "react-icons/md";
import { newsletterSignup } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { footerDetails } from "@/constants/details";
import { footerFeatures } from "@/constants/ui";
import { CatalogueFooterProps } from "@/types/components";
import PartnerBadge from "../common/PartnerBadge";
import SmartLink from "../common/SmartLink";
import SocialIcon from "../common/SocialIcon";

const CatalogueFooter: React.FC<CatalogueFooterProps> = ({
	type = "default",
	data,
	logo,
}) => {
	const [newsletterEmail, setNewsletterEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const socialLinks = footerDetails.socials;

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsSubmitting(true);
		setSubmitError("");
		setSubmitSuccess(false);

		try {
			await newsletterSignup(
				newsletterEmail,
				data?.catalogue?.id,
				data?.catalogue?.owner_id,
			);
			setNewsletterEmail("");
			setSubmitSuccess(true);
			setTimeout(() => setSubmitSuccess(false), 3000);
		} catch (error: any) {
			console.error("Newsletter signup failed:", error);
			const message =
				error?.message ||
				error?.response?.data?.message ||
				"Failed to subscribe. Please try again.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<footer
			aria-label={`${type === "default" ? "Quicktalog" : data?.legal?.name || "Custom"} footer`}
			className="border-t mt-auto font-body font-weight-body tracking-body bg-footer-bg text-footer-text border-footer-border"
			role="contentinfo"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="py-12 sm:py-16">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
						<div className="space-y-6">
							<div className="space-y-4">
								<div
									aria-label={`Go to ${type === "default" ? "Quicktalog" : data?.legal?.name || "Custom"} homepage`}
									className="flex flex-col items-start space-y-6 mt-2 group transition-transform duration-200 hover:scale-102"
								>
									<SmartLink
										href={
											type === "default"
												? "/"
												: data?.socialLinks?.website || ""
										}
									>
										<img
											alt={`${type === "default" ? "Quicktalog" : data?.legal?.name || "Custom"} logo`}
											className="w-auto max-h-[7vh] object-cover max-w-[150px] lg:max-w-[200px] h-48"
											height={40}
											src={logo ?? "/logo.svg"}
											width={type === "default" ? 120 : 100}
										/>
									</SmartLink>

									{type === "default" && (
										<p className="text-sm text-card-description">
											Digital Catalogue Platform
										</p>
									)}
									{type === "custom" && (
										<div className="ml-0">
											<h3 className="text-xl font-semibold font-heading font-weight-heading tracking-heading text-section-heading">
												{data?.legal?.name}
											</h3>
										</div>
									)}
								</div>
								<p className="text-sm leading-relaxed text-card-description">
									{type === "default" ? footerDetails.subheading : ""}
								</p>
							</div>
							{type === "custom" &&
								data?.socialLinks &&
								Object.keys(data?.socialLinks).length > 0 && (
									<nav
										aria-label="Social media links"
										className="flex items-center space-x-3"
										role="navigation"
									>
										{Object.keys(data?.socialLinks).map((platform) => {
											const socialUrl = data?.socialLinks[platform];
											if (platform && socialUrl) {
												return (
													<SocialIcon
														href={socialUrl}
														key={platform}
														platform={platform}
													/>
												);
											}
											return null;
										})}
									</nav>
								)}
						</div>

						{(type === "default" || data?.email) && (
							<div className="space-y-6">
								<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-section-heading">
									<div
										aria-hidden="true"
										className="w-1 h-5 bg-primary rounded-full"
									></div>
									<span>Contact & Support</span>
								</h4>
								<ul className="space-y-4">
									<li>
										<a
											aria-label={`Send email to ${type === "default" ? footerDetails.email : data?.email || "contact"}`}
											className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-card-description"
											href={`mailto:${type === "default" ? footerDetails.email : data?.email}`}
										>
											<FiMail
												aria-hidden="true"
												className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
											/>
											<span>
												{type === "default" ? footerDetails.email : data?.email}
											</span>
										</a>
									</li>
									{data?.phone && (
										<li>
											<a
												aria-label={`Call ${data?.phone}`}
												className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-card-description"
												href={`tel:${data?.phone}`}
											>
												<FiPhone
													aria-hidden="true"
													className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
												/>
												<span>{data?.phone}</span>
											</a>
										</li>
									)}
									{type === "default" && (
										<li>
											<Link
												aria-label="Contact us"
												className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-card-description"
												href="/contact"
											>
												<FiExternalLink
													aria-hidden="true"
													className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
												/>
												<span>Contact Us</span>
											</Link>
										</li>
									)}
								</ul>
							</div>
						)}

						<div className="space-y-6">
							{type === "default" ? (
								<>
									<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-section-heading">
										<div
											aria-hidden="true"
											className="w-1 h-5 bg-primary rounded-full"
										></div>
										<span>Platform Features</span>
									</h4>
									<ul className="space-y-4">
										{footerFeatures.map((feature, index) => (
											<li
												className="flex items-start space-x-3 group text-card-description"
												key={`footer-feature-${index}`}
											>
												<div className="mt-1 group-hover:scale-110 transition-transform duration-200 text-primary">
													{feature.icon}
												</div>
												<div>
													<div className="font-semibold text-sm font-heading font-weight-heading tracking-heading text-card-heading">
														{feature.title}
													</div>
													<div className="text-xs opacity-75">
														{feature.description}
													</div>
												</div>
											</li>
										))}
									</ul>
								</>
							) : data?.legal?.name || data?.legal?.address ? (
								<>
									<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-section-heading">
										<div
											aria-hidden="true"
											className="w-1 h-5 bg-primary rounded-full"
										></div>
										<span>Company Information</span>
									</h4>
									<ul className="space-y-4">
										{data?.legal?.name && (
											<li className="flex items-center space-x-3">
												<MdTitle className="w-4 h-4 flex-shrink-0 text-card-description" />
												<span className="text-sm text-card-description">
													{data?.legal?.name}
												</span>
											</li>
										)}
										{data?.legal?.address && (
											<li className="flex items-start space-x-3">
												<FiMapPin className="w-4 h-4 mt-1 flex-shrink-0 text-card-description" />
												<div className="text-sm text-card-description">
													<div>{data?.legal?.address}</div>
												</div>
											</li>
										)}
									</ul>
								</>
							) : null}
						</div>
						<div className="space-y-6">
							{type === "default" ? (
								<>
									<div className="flex items-center space-x-3">
										{Object.keys(socialLinks).map((platform, index) => (
											<SocialIcon
												className="rounded-lg"
												href={socialLinks[platform as keyof typeof socialLinks]}
												key={`social-${index}`}
												platform={platform}
											/>
										))}
									</div>

									<Button
										asChild
										className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-card-bg text-foreground border-primary footer-cta-button"
										size="default"
										variant="secondary"
									>
										<Link
											aria-label="Create your own digital catalog"
											href="/auth?mode=signup"
										>
											<FiPlus className="w-4 h-4" />
											Create Your Digital Catalog
										</Link>
									</Button>
								</>
							) : data?.partners && data?.partners.length > 0 ? (
								<>
									<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-section-heading">
										<div
											aria-hidden="true"
											className="w-1 h-5 bg-primary rounded-full"
										></div>
										<span>Trusted Partners</span>
									</h4>
									<ul className="space-y-3">
										{data?.partners.map((partner, index) => (
											<li key={`partner-${index}`}>
												<PartnerBadge partner={partner} />
											</li>
										))}
									</ul>
								</>
							) : null}
						</div>
					</div>
				</div>

				<div className="border-t py-6 border-footer-border">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-card-description">
						<span>
							© {new Date().getFullYear()}{" "}
							{type === "default"
								? "Quicktalog"
								: data?.legal?.name || "Your Company"}
							. All rights reserved.
						</span>
						<nav
							aria-label="Legal links"
							className="flex items-center space-x-6"
							role="navigation"
						>
							{type === "default" ? (
								<>
									<Link
										aria-label="Privacy Policy"
										className="hover:text-primary transition-colors duration-200"
										href="/privacy-policy"
									>
										Privacy Policy
									</Link>
									<Link
										aria-label="Terms of Service"
										className="hover:text-primary transition-colors duration-200"
										href="/terms-and-conditions"
									>
										Terms of Service
									</Link>
									<Link
										aria-label="Refund Policy"
										className="hover:text-primary transition-colors duration-200"
										href="/refund-policy"
									>
										Refund Policy
									</Link>
								</>
							) : (
								<>
									{data?.legal?.privacy_policy && (
										<SmartLink
											aria-label="Privacy Policy"
											className="hover:text-primary transition-colors duration-200"
											href={data?.legal?.privacy_policy}
										>
											Privacy Policy
										</SmartLink>
									)}
									{data?.legal?.terms_and_conditions && (
										<SmartLink
											aria-label="Terms of Service"
											className="hover:text-primary transition-colors duration-200"
											href={data?.legal?.terms_and_conditions}
										>
											Terms of Service
										</SmartLink>
									)}
								</>
							)}
						</nav>

						{/* Enhanced Newsletter for Custom */}
						{type === "custom" && data?.newsletter?.enabled ? (
							<div className="flex flex-col h-full">
								<div className="flex-1 flex items-center">
									<form
										aria-label="Newsletter subscription"
										className="flex items-center space-x-2 w-full"
										onSubmit={handleNewsletterSubmit}
										role="form"
									>
										<div className="relative">
											<label className="sr-only" htmlFor="newsletter-email">
												Email address
											</label>
											<input
												aria-describedby="newsletter-description"
												aria-invalid={submitError ? "true" : "false"}
												className="w-48 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card-bg text-card-text border border-card-border"
												disabled={isSubmitting || submitSuccess}
												id="newsletter-email"
												onChange={(e) => setNewsletterEmail(e.target.value)}
												placeholder="your@email.com"
												required
												type="email"
												value={newsletterEmail}
											/>
										</div>
										<Button
											aria-label="Subscribe to newsletter"
											className={`font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border footer-cta-button flex items-center gap-2 ${
												submitSuccess
													? "bg-green-500 text-white border-green-500 hover:bg-green-600"
													: "hover:bg-primary/10 hover:text-primary bg-card-bg text-foreground border-primary"
											}`}
											disabled={isSubmitting || submitSuccess}
											size="default"
											type="submit"
											variant="secondary"
										>
											{isSubmitting ? (
												<span>Subscribing...</span>
											) : submitSuccess ? (
												<div className="flex items-center gap-2">
													<FiCheck className="w-4 h-4" />
													<span>Subscribed</span>
												</div>
											) : (
												<span>Subscribe</span>
											)}
										</Button>
										{submitError && (
											<p
												aria-live="polite"
												className="text-red-500 text-xs absolute -bottom-6 left-0"
												role="alert"
											>
												{submitError}
											</p>
										)}
									</form>
								</div>
							</div>
						) : null}
						{type === "custom" &&
							data?.ctaFooter?.enabled &&
							data?.ctaFooter?.url && (
								<Button
									asChild
									className="font-heading tracking-heading min-w-[50%] max-w-[96%] sm:min-w-fit lg:w-fit text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-card-bg text-foreground border-primary footer-cta-button flex items-center gap-2"
									size="default"
									variant="secondary"
								>
									<SmartLink
										aria-label={data?.ctaFooter.label}
										href={data?.ctaFooter.url}
									>
										<FiExternalLink className="w-4 h-4" />
										{data?.ctaFooter.label}
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
