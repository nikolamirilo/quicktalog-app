import { footerDetails, siteDetails } from "@/constants/details";
import { getPlatformIconByName } from "@/constants/ui";
import { ILinkItem } from "@/types/shared";
import Link from "next/link";
import React from "react";
import { FiExternalLink, FiGlobe, FiMail } from "react-icons/fi";
import NewsletterForm from "./NewsletterForm";

const FooterLinkColumn: React.FC<{ title: string; links: ILinkItem[] }> = ({
	title,
	links,
}) => (
	<div className="space-y-4">
		<h4 className="text-lg font-semibold text-product-foreground">{title}</h4>
		<ul className="space-y-3">
			{links.map((link) => (
				<li key={link.url}>
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
);

const Footer: React.FC = () => {
	const year = new Date().getFullYear();

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
								src="/images/brand/logo.svg"
								width={140}
							/>
						</Link>
						<p className="text-product-foreground-accent leading-relaxed max-w-sm">
							{footerDetails.subheading}
						</p>

						<div className="flex items-center gap-4 pt-2">
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

							<a
								aria-label="Email us"
								className="p-2 rounded-lg bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-3 group"
								href={`mailto:${footerDetails.email}`}
							>
								<div className="group-hover:text-product-primary transition-colors duration-300">
									<FiMail className="min-w-fit" size={24} />
								</div>
							</a>

							<a
								aria-label="Visit our website"
								className="p-2 rounded-lg bg-white text-gray-600 border border-gray-200 transition-all duration-300 hover:scale-110 hover:rotate-3 group"
								href={siteDetails.siteUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<div className="group-hover:text-product-primary transition-colors duration-300">
									<FiGlobe className="min-w-fit" size={24} />
								</div>
							</a>
						</div>
					</div>

					<FooterLinkColumn
						links={footerDetails.productLinks}
						title="Product"
					/>
					<FooterLinkColumn
						links={footerDetails.resourceLinks}
						title="Resources"
					/>

					{/* Newsletter Subscription */}
					<div className="space-y-4">
						<h4 className="text-lg font-semibold text-product-foreground">
							Stay Updated
						</h4>
						<p className="text-sm text-product-foreground-accent">
							Subscribe to our newsletter for the latest updates and features.
						</p>
						<NewsletterForm />
						<Link
							className="text-product-foreground-accent hover:text-product-primary transition-colors duration-200 flex items-center gap-2 group"
							href={footerDetails.contactLink.url}
						>
							<span>{footerDetails.contactLink.text}</span>
							<FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
						</Link>
					</div>
				</div>

				{/* Copyright */}
				<div className="pt-8 border-t border-product-border">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-product-foreground-accent text-sm">
							Copyright &copy; {year} {siteDetails.siteName}. All rights
							reserved.
						</p>
						<div className="flex flex-row items-center gap-2 md:gap-6 text-sm text-product-foreground-accent">
							{footerDetails.legalLinks.map((link) => (
								<Link
									className="hover:text-product-primary transition-colors duration-200"
									href={link.url}
									key={link.url}
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
