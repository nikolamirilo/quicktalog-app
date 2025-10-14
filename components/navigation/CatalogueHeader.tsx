import Link from "next/link";
import React from "react";
import { FiExternalLink, FiMail, FiPhone, FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { CatalogueHeaderProps } from "@/types/components";
import SmartLink from "../common/SmartLink";

const CatalogueHeader: React.FC<CatalogueHeaderProps> = ({
	type = "default",
	data,
	logo,
}) => {
	const createContactLink = (
		href: string,
		icon: React.ReactNode,
		label: string,
	) => ({
		href,
		icon,
		label,
		className:
			"font-heading tracking-heading px-2 h-9 rounded-lg border hover:scale-105 transition-all duration-200 group text-xs sm:text-sm lg:text-sm flex items-center justify-center bg-header-bg text-header-text border-primary footer-cta-button",
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
					"Send email to quicktalog@outlook.com",
				),
			);
		} else if (type === "custom" && data) {
			if (data?.email) {
				links.push(
					createContactLink(
						`mailto:${data?.email}`,
						<FiMail
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Send email to ${data?.email}`,
					),
				);
			}
			if (data?.phone) {
				links.push(
					createContactLink(
						`tel:${data?.phone}`,
						<FiPhone
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Call ${data?.phone}`,
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

		if (type === "custom" && data?.ctaNavbar?.enabled && data?.ctaNavbar.url) {
			return {
				href: data?.ctaNavbar.url,
				label: data?.ctaNavbar.label || "Learn more",
				shortLabel: data?.ctaNavbar.label || "Learn more",
				icon: <FiExternalLink aria-hidden="true" className="w-4 h-4 mr-2" />,
				ariaLabel: data?.ctaNavbar.label || "Learn more",
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
			className="border-b shadow-lg z-50 bg-header-bg text-header-text border-card-border font-body tracking-body"
			role="banner"
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between py-2 sm:py-3">
					<div className="flex items-center">
						<Link
							aria-label={`Go to ${companyName} homepage`}
							className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
							href={type === "default" ? "/" : ""}
						>
							<img
								alt={`${companyName} logo`}
								className="w-auto h-[7vh] object-cover"
								fetchPriority="high"
								height={40}
								src={logo ?? "/logo.svg"}
								width={type === "default" ? 120 : 100}
							/>
						</Link>
					</div>

					<nav
						aria-label="Contact and actions"
						className="flex items-center space-x-2 sm:space-x-4"
						role="navigation"
					>
						{contactLinks.length > 0 && (
							<div
								aria-label="Contact options"
								className="hidden sm:flex items-center space-x-2"
								role="group"
							>
								{contactLinks.map((linkProps, index) => (
									<Link
										aria-label={linkProps.label}
										className={linkProps.className}
										href={linkProps.href}
										key={`contact-${index}`}
									>
										{linkProps.icon}
									</Link>
								))}
							</div>
						)}

						{ctaProps && (
							<Button
								asChild
								className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-header-bg text-header-text border-primary footer-cta-button"
								size="default"
								variant="secondary"
							>
								<SmartLink
									aria-label={ctaProps.ariaLabel}
									className="flex items-center"
									href={ctaProps.href}
								>
									{ctaProps.icon}
									<span className="hidden sm:inline">{ctaProps.label}</span>
									<span className="sm:hidden">{ctaProps.shortLabel}</span>
								</SmartLink>
							</Button>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
};

export default CatalogueHeader;
