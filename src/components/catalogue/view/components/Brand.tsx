import { SmartLink } from "@/components/general/SmartLink";
import { uniqueSocials } from "@/lib/catalogue/socials";
import type { Catalogue } from "@quicktalog/common";
import { FiExternalLink } from "react-icons/fi";
import { SocialIcon } from "./SocialIcon";

/** The footer's first column: logo, tagline, social links and, without a newsletter, the action button. */
const Brand = ({
	activeData,
	logo,
	showCta,
}: {
	activeData: Catalogue | undefined;
	logo: string | undefined;
	showCta: boolean;
}) => {
	const contact = activeData?.contact;
	const name = activeData?.legal?.legalName || "Company";
	const socials = uniqueSocials(contact?.socials);
	const cta = activeData?.footer?.cta;
	const tagline = activeData?.footer?.tagline?.trim();

	return (
		<div className="cat-foot-wide">
			{logo ? (
				<SmartLink
					ariaLabel={`Go to ${name} homepage`}
					className="cat-foot-logo"
					href={contact?.website || ""}
				>
					<img
						alt={`${name} logo`}
						src={logo}
						style={{ width: `${activeData?.footer?.logoSize?.width || 100}px` }}
					/>
				</SmartLink>
			) : (
				// Without a logo the business name stands in for it.
				activeData?.legal?.legalName && (
					<h3 className="cat-foot-name">{activeData.legal.legalName}</h3>
				)
			)}
			{tagline && <p className="cat-foot-tag">{tagline}</p>}
			{(socials.length > 0 || contact?.email || contact?.website) && (
				<nav aria-label="Social media links" className="cat-foot-social">
					{socials.map(({ platform, url }) => (
						<SmartLink
							ariaLabel={
								platform === "website"
									? "Visit our page"
									: `Follow us on ${platform}`
							}
							href={url}
							key={url}
						>
							<SocialIcon platform={platform} />
						</SmartLink>
					))}
					{contact?.email && (
						<a aria-label="Email us" href={`mailto:${contact.email}`}>
							<SocialIcon platform="email" />
						</a>
					)}
					{contact?.website && (
						<SmartLink ariaLabel="Visit our website" href={contact.website}>
							<SocialIcon platform="website" />
						</SmartLink>
					)}
				</nav>
			)}
			{showCta && cta?.url && (
				<div className="mt-5">
					<SmartLink className="cat-foot-btn" href={cta.url}>
						<FiExternalLink aria-hidden="true" />
						<span className="truncate">{cta.label || "Learn more"}</span>
					</SmartLink>
				</div>
			)}
		</div>
	);
};

export default Brand;
