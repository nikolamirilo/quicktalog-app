"use client";
import SmartLink from "@/components/general/SmartLink";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { CatalogueHeaderProps } from "@/types/components";
import Link from "next/link";
import React, { useState } from "react";
import { FiExternalLink, FiMail, FiPhone, FiPlus } from "react-icons/fi";
import CatalogueSidebar from "./CatalogueSidebar";

const CatalogueHeader: React.FC<CatalogueHeaderProps> = ({
	type = "default",
	data,
	logo,
}) => {
	const { catalogue } = useCatalogueContext();
	const activeData = catalogue?.name ? catalogue : data;
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const themeClass = activeData?.appearance?.theme?.name || "theme-monochrome";

	const createContactLink = (
		href: string,
		icon: React.ReactNode,
		label: string,
	) => ({
		href,
		icon,
		label,
		className:
			"font-heading tracking-heading px-2 h-9 rounded-lg border hover:scale-105 transition-all duration-200 group text-xs sm:text-sm lg:text-sm flex items-center justify-center bg-catalogue-navigation-background text-catalogue-navigation-text border-primary footer-cta-button",
	});

	const getContactLinks = () => {
		const links = [];

		if (type === "default") {
			links.push(
				createContactLink(
					"mailto:quicktalog@outlook.com",
					<FiMail
						aria-hidden="true"
						className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
					/>,
					"Email",
				),
			);
		} else if (type === "custom" && activeData) {
			if (activeData?.contact?.email && activeData?.header?.emailCta) {
				links.push(
					createContactLink(
						`mailto:${activeData?.contact?.email}`,
						<FiMail
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Email`,
					),
				);
			}
			if (activeData?.contact?.phone && activeData?.header?.phoneCta) {
				links.push(
					createContactLink(
						`tel:${activeData?.contact?.phone}`,
						<FiPhone
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Phone`,
					),
				);
			}
		}

		return links;
	};

	const getCTAProps = () => {
		if (type === "default") {
			return {
				href: "/auth?mode=signup",
				label: "Create Your Catalog",
				shortLabel: "Get Started",
				icon: <FiPlus aria-hidden="true" className="w-4 h-4 mr-2" />,
				ariaLabel: "Create your own digital catalog",
			};
		}

		if (
			type === "custom" &&
			activeData?.header?.cta?.isEnabled &&
			activeData?.header?.cta.url
		) {
			return {
				href: activeData?.header?.cta.url,
				label: activeData?.header?.cta.label || "Learn more",
				shortLabel: activeData?.header?.cta.label || "Learn more",
				icon: <FiExternalLink aria-hidden="true" className="w-4 h-4 lg:mr-1" />,
				ariaLabel: activeData?.header?.cta.label || "Learn more",
			};
		}

		return null;
	};

	const contactLinks = getContactLinks();
	const ctaProps = getCTAProps();
	const companyName = type === "default" ? "Quicktalog" : "Company";

	return (
		<header
			aria-label={`${companyName} header navigation`}
			className="border-b shadow-lg z-50 bg-catalogue-navigation-background flex flex-row justify-between items-center  text-catalogue-navigation-text border-catalogue-card-border font-body min-h-[7vh]"
			role="banner"
		>
			<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-row justify-between items-center h-full w-full">
				<div className="flex items-center justify-between py-2 sm:py-4 w-full">
					<div className="flex items-center">
						<Link
							aria-label={`Go to ${companyName} homepage`}
							className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
							href={
								type === "default"
									? `/`
									: `${catalogue.contact.website ? catalogue.contact.website : "/"}`
							}
						>
							<img
								alt={`${companyName} logo`}
								className="w-auto max-h-[7vh] object-cover max-w-[150px] lg:max-w-[200px] rounded-sm"
								fetchPriority="high"
								height={40}
								src={logo ?? "/logo.svg"}
								width={type === "default" ? 120 : 100}
							/>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav
						aria-label="Contact and actions"
						className="hidden md:flex items-center space-x-2 md:space-x-4"
						role="navigation"
					>
						{contactLinks.length > 0 && (
							<div
								aria-label="Contact options"
								className="flex items-center space-x-2 md:space-x-4"
								role="group"
							>
								{contactLinks.map((linkProps, index) => (
									<Link
										aria-label={linkProps.label}
										className={linkProps.className}
										href={linkProps.href}
										key={`contact-${index}`}
										title={linkProps.label}
									>
										{linkProps.icon}
									</Link>
								))}
							</div>
						)}

						{ctaProps && (
							<Button
								asChild
								className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary text-catalogue-navigation-text border-primary footer-cta-button"
								size="default"
								variant="outline"
							>
								<SmartLink
									aria-label={ctaProps.ariaLabel}
									className="flex items-center"
									href={ctaProps.href}
								>
									{ctaProps.icon}
									<span>{ctaProps.label}</span>
								</SmartLink>
							</Button>
						)}
					</nav>

					{/* Mobile Navigation (Hamburger) */}
					<div className="md:hidden flex items-center">
						<CatalogueSidebar
							isOpen={isMobileMenuOpen}
							onOpenChange={setIsMobileMenuOpen}
							contactLinks={contactLinks}
							ctaProps={ctaProps}
							themeClass={themeClass}
						/>
					</div>
				</div>
			</div>
		</header>
	);
};

export default CatalogueHeader;
