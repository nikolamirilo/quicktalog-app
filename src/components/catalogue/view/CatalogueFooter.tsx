"use client";
import { newsletterSignup } from "@/actions/newsletter";
import { footerDetails } from "@/constants/details";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { socialPlatform } from "@/lib/catalogue/socials";
import type { Catalogue } from "@quicktalog/common";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { FiExternalLink, FiMail } from "react-icons/fi";
import { SmartLink } from "@/components/general/SmartLink";
import Brand from "./components/Brand";
import CompanyInfo from "./components/CompanyInfo";
import Contact from "./components/Contact";
import DefaultActions from "./components/DefaultActions";
import Features from "./components/Features";
import LegalLinks from "./components/LegalLinks";
import Newsletter from "./components/Newsletter";
import Partners from "./components/Partners";
import { SocialIcon } from "./components/SocialIcon";

export type CatalogueFooterProps = {
	type?: "default" | "custom";
	data?: Catalogue;
	logo: string;
};

/** Columns of the Quicktalog footer: brand, contact, platform, create your own. */
const DEFAULT_COLUMNS = "1.2fr 1fr 1fr 1.3fr";

const QuicktalogColumns = ({ logo }: { logo: string }) => (
	<>
		<div className="cat-foot-wide">
			<Link
				aria-label="Go to Quicktalog homepage"
				className="cat-foot-logo"
				href="/"
			>
				<img alt="Quicktalog logo" src={logo} style={{ width: "160px" }} />
			</Link>
			<p className="cat-foot-tag">{footerDetails.subheading}</p>
			<nav aria-label="Social media links" className="cat-foot-social">
				{Object.values(footerDetails.socials).map((url) => (
					<SmartLink
						ariaLabel={`Follow Quicktalog on ${socialPlatform(url)}`}
						href={url}
						key={url}
					>
						<SocialIcon platform={socialPlatform(url)} />
					</SmartLink>
				))}
				<a aria-label="Email us" href={`mailto:${footerDetails.email}`}>
					<SocialIcon platform="email" />
				</a>
			</nav>
		</div>
		<div className="cat-foot-col">
			<h2>Contact & Support</h2>
			<ul className="cat-foot-links">
				<li>
					<a href={`mailto:${footerDetails.email}`}>
						<FiMail aria-hidden="true" />
						{footerDetails.email}
					</a>
				</li>
				<li>
					<Link href="/contact">
						<FiExternalLink aria-hidden="true" />
						Contact Us
					</Link>
				</li>
			</ul>
		</div>
		<Features />
		<DefaultActions />
	</>
);

/**
 * The site footer's structure in catalogue colours. A custom footer shows only
 * the columns the owner filled in, so the grid template is built from them.
 */
const CatalogueFooter: React.FC<CatalogueFooterProps> = ({
	type = "default",
	data,
	logo,
}) => {
	// Not in the builder on the public catalogue view - there is no provider
	// there, so the context is null and `data` is the only source.
	const { catalogue } = useCatalogueContext() || {};
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
			const result = await newsletterSignup(newsletterEmail, activeData?.id);

			if (result.status === "success") {
				setNewsletterEmail("");
				setSubmitSuccess(true);
				setTimeout(() => setSubmitSuccess(false), 3000);
			} else {
				setSubmitError("Failed to subscribe. Please try again.");
			}
		} catch (error: any) {
			console.error("Newsletter signup failed:", error);
			setSubmitError("Failed to subscribe. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const footer = activeData?.footer;
	const contact = activeData?.contact;
	const legal = activeData?.legal;
	const isCustom = type === "custom";
	const hasContact = !!(contact?.email || contact?.phone || contact?.website);
	const hasVisit = !!(legal?.legalName || legal?.address);
	const hasNewsletter = isCustom && !!footer?.newsletter;
	const ctaOn = !!(footer?.cta?.isEnabled && footer.cta.url);
	const columns = isCustom
		? [
				"1.2fr",
				...(hasContact ? ["1fr"] : []),
				...(hasVisit ? ["1fr"] : []),
				...(hasNewsletter ? ["1.3fr"] : []),
			].join(" ")
		: DEFAULT_COLUMNS;
	const partners =
		isCustom && footer?.showPartners ? (activeData?.partners ?? []) : [];
	const ownerName = isCustom
		? legal?.legalName || "Your Company"
		: "Quicktalog";

	return (
		<footer
			aria-label={`${isCustom ? legal?.legalName || "Custom" : "Quicktalog"} footer`}
			className="cat-foot pb-24 sm:pb-8"
			role="contentinfo"
		>
			<div className="cat-foot-in">
				<div
					className="cat-foot-grid"
					style={{ "--cat-foot-cols": columns } as React.CSSProperties}
				>
					{isCustom ? (
						<>
							<Brand
								activeData={activeData}
								logo={logo}
								showCta={ctaOn && !hasNewsletter}
							/>
							<Contact contact={contact} />
							<CompanyInfo legal={legal} />
							{hasNewsletter && (
								<Newsletter
									cta={footer?.cta}
									handleNewsletterSubmit={handleNewsletterSubmit}
									isSubmitting={isSubmitting}
									newsletterEmail={newsletterEmail}
									setNewsletterEmail={setNewsletterEmail}
									submitError={submitError}
									submitSuccess={submitSuccess}
								/>
							)}
						</>
					) : (
						<QuicktalogColumns logo={logo} />
					)}
				</div>

				<Partners partners={partners} />

				<div className="cat-foot-bottom">
					<span>
						© {new Date().getFullYear()} {ownerName}. All rights reserved.
					</span>
					<LegalLinks legal={legal} type={type} />
				</div>
			</div>
		</footer>
	);
};

export default CatalogueFooter;
