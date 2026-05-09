"use client";
import { Button } from "@/components/ui/button";
import { footerDetails, siteDetails } from "@/constants/details";
import { getPlatformIconByName } from "@/constants/ui";
import { productNewsletterSignup } from "@/server_actions/newsletter";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FiCheck, FiExternalLink, FiGlobe, FiMail } from "react-icons/fi";

const Footer: React.FC = () => {
	const [newsletterEmail, setNewsletterEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submitStatus, setSubmitStatus] = useState<
		"idle" | "success" | "already_subscribed"
	>("idle");
	const [year, setYear] = useState<number | null>(null);

	useEffect(() => {
		setYear(new Date().getFullYear());
	}, []);

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsSubmitting(true);
		setSubmitError("");
		setSubmitStatus("idle");

		try {
			const result = await productNewsletterSignup(newsletterEmail);

			if (result.status === "success") {
				setNewsletterEmail("");
				setSubmitStatus("success");
				setTimeout(() => setSubmitStatus("idle"), 3000);
			} else if (result.status === "already_subscribed") {
				setSubmitStatus("already_subscribed");
				setTimeout(() => setSubmitStatus("idle"), 3000);
			} else {
				setSubmitError("Failed to subscribe. Please try again.");
			}
		} catch (error: any) {
			const message =
				error?.message || "Failed to subscribe. Please try again.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<footer className="bg-product-background-hero text-product-foreground py-16 border-t border-product-border">
			<div className="max-w-7xl w-full mx-auto px-6">
				{/* Main footer content */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
					{/* Brand section */}
					<div className="space-y-4">
						<Link className="flex items-center gap-3 group" href="/">
							<img
								alt="Quicktalog Logo"
								className="w-auto h-12 rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
								height={140}
								src="/logo.svg"
								width={140}
							/>
							{/* <h3 className="font-lora text-xl font-semibold cursor-pointer group-hover:text-product-primary transition-colors duration-200">
                {siteDetails.siteName}
              </h3> */}
						</Link>
						<p className="text-product-foreground-accent leading-relaxed max-w-sm">
							{footerDetails.subheading}
						</p>
						{/* <div className="flex items-center gap-4 pt-2">
              <a
                href={`mailto:${footerDetails.email}`}
                className="flex items-center gap-2 text-product-foreground-accent hover:text-product-primary transition-colors duration-200">
                <FiMail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </a>
              <a
                href={`tel:${footerDetails.telephone}`}
                className="flex items-center gap-2 text-product-foreground-accent hover:text-product-primary transition-colors duration-200">
                <FiPhone className="w-4 h-4" />
                <span className="text-sm">Phone</span>
              </a>
            </div> */}
					</div>

					{/* Quick Links */}
					<div className="space-y-4">
						<h4 className="text-lg font-semibold text-product-foreground">
							Quick Links
						</h4>
						<ul className="space-y-3">
							{footerDetails.quickLinks.map((link) => (
								<li key={link.text}>
									<Link
										className="text-product-foreground-accent hover:text-product-primary transition-colors duration-200 flex items-center gap-2 group"
										href={link.url}
									>
										<span>{link.text}</span>
										<FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Social Links */}
					<div className="space-y-4">
						<h4 className="text-lg font-semibold text-product-foreground">
							Connect With Us
						</h4>
						<div className="flex items-center gap-4">
							{/* LinkedIn and other social links */}
							{footerDetails.socials &&
								Object.keys(footerDetails.socials).map((platformName) => {
									if (platformName && footerDetails.socials[platformName]) {
										return (
											<Link
												aria-label={platformName}
												className="p-2 rounded-lg bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-3 group"
												href={footerDetails.socials[platformName]}
												key={platformName}
											>
												<div className="group-hover:text-product-primary transition-colors duration-300">
													{getPlatformIconByName(platformName)}
												</div>
											</Link>
										);
									}
								})}

							{/* Mail icon */}
							<a
								aria-label="Email us"
								className="p-2 rounded-lg bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-3 group"
								href={`mailto:${footerDetails.email}`}
							>
								<div className="group-hover:text-product-primary transition-colors duration-300">
									<FiMail className="min-w-fit" size={24} />
								</div>
							</a>

							{/* Website icon */}
							<a
								aria-label="Visit our website"
								className="p-2 rounded-lg bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-3 group"
								href="https://www.quicktalog.app"
								rel="noopener noreferrer"
								target="_blank"
							>
								<div className="group-hover:text-product-primary transition-colors duration-300">
									<FiGlobe className="min-w-fit" size={24} />
								</div>
							</a>
						</div>
					</div>

					{/* Newsletter Subscription */}
					<div className="space-y-4">
						<h4 className="text-lg font-semibold text-product-foreground">
							Stay Updated
						</h4>
						<p className="text-sm text-product-foreground-accent">
							Subscribe to our newsletter for the latest updates and features.
						</p>
						<form className="space-y-3" onSubmit={handleNewsletterSubmit}>
							<div className="relative">
								<input
									className="w-full px-4 py-3 bg-product-background border border-product-border rounded-lg text-product-foreground placeholder-product-foreground-accent focus:outline-none focus:ring-2 focus:ring-product-primary/50 focus:border-product-primary transition-colors duration-200"
									disabled={isSubmitting || submitStatus !== "idle"}
									onChange={(e) => setNewsletterEmail(e.target.value)}
									placeholder="Enter your email"
									required
									type="email"
									value={newsletterEmail}
								/>
							</div>
							<Button
								className={`w-full transition-colors duration-200 font-semibold ${
									submitStatus === "success"
										? "bg-green-500 text-white hover:bg-green-600"
										: submitStatus === "already_subscribed"
											? "bg-blue-500 text-white hover:bg-blue-600"
											: "bg-product-primary text-product-foreground "
								}`}
								disabled={isSubmitting || submitStatus !== "idle"}
								type="submit"
							>
								{isSubmitting ? (
									"Subscribing..."
								) : submitStatus === "success" ? (
									<div className="flex items-center justify-center gap-2">
										<FiCheck className="w-4 h-4" />
										Subscribed
									</div>
								) : submitStatus === "already_subscribed" ? (
									<div className="flex items-center justify-center gap-2">
										<FiCheck className="w-4 h-4" />
										Already subscribed
									</div>
								) : (
									"Subscribe"
								)}
							</Button>
							{submitStatus === "already_subscribed" && (
								<p
									aria-live="polite"
									className="text-product-foreground-accent text-xs"
								>
									This email is already on our list.
								</p>
							)}
							{submitError && (
								<p
									aria-live="polite"
									className="text-red-500 text-xs"
									role="alert"
								>
									{submitError}
								</p>
							)}
						</form>
					</div>
				</div>

				{/* Copyright */}
				<div className="pt-8 border-t border-product-border">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-product-foreground-accent text-sm">
							Copyright &copy; {year ?? ""} {siteDetails.siteName}. All rights
							reserved.
						</p>
						<div className="flex flex-row items-center gap-2 md:gap-6 text-sm text-product-foreground-accent">
							{footerDetails.legalLinks.map((link, index) => (
								<Link
									className="hover:text-product-primary transition-colors duration-200"
									href={link.url}
									key={`detail-${index}`}
								>
									{link.text}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
