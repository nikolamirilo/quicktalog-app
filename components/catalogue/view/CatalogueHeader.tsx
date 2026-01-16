import SmartLink from "@/components/general/SmartLink";
import { Button } from "@/components/ui/button";
import { CatalogueHeaderProps } from "@/types/components";
import Link from "next/link";
import React from "react";
import { FiExternalLink, FiMail, FiPhone, FiPlus } from "react-icons/fi";

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
			"font-heading tracking-heading px-2 h-9 rounded-lg border hover:scale-105 transition-all duration-200 group text-xs sm:text-sm lg:text-sm flex items-center justify-center bg-header-bg text-footer-text border-primary footer-cta-button",
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
			if (data?.contact?.email && data?.header?.emailCta) {
				links.push(
					createContactLink(
						`mailto:${data?.contact?.email}`,
						<FiMail
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Send email to ${data?.contact?.email}`,
					),
				);
			}
			if (data?.contact?.phone && data?.header?.phoneCta) {
				links.push(
					createContactLink(
						`tel:${data?.contact?.phone}`,
						<FiPhone
							aria-hidden="true"
							className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
						/>,
						`Call ${data?.contact?.phone}`,
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
			data?.header?.cta?.isEnabled &&
			data?.header?.cta.url
		) {
			return {
				href: data?.header?.cta.url,
				label: data?.header?.cta.label || "Learn more",
				shortLabel: data?.header?.cta.label || "Learn more",
				icon: <FiExternalLink aria-hidden="true" className="w-4 h-4 lg:mr-1" />,
				ariaLabel: data?.header?.cta.label || "Learn more",
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
			className="border-b shadow-lg z-50 bg-header-bg flex flex-row justify-between items-center  text-header-text border-card-border font-body tracking-body min-h-[7vh]"
			role="banner"
		>
			<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-row justify-between items-center h-full w-full">
				<div className="flex items-center justify-between py-2 sm:py-4 w-full">
					<div className="flex items-center">
						<Link
							aria-label={`Go to ${companyName} homepage`}
							className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
							href={type === "default" ? "/" : ""}
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

					<nav
						aria-label="Contact and actions"
						className="flex items-center space-x-2 md:space-x-4"
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
									>
										{linkProps.icon}
									</Link>
								))}
							</div>
						)}

						{ctaProps && (
							<Button
								asChild
								className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-card-bg text-header-text border-primary footer-cta-button"
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
