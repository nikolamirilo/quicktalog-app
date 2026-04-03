import { useCatalogueContext } from "@/context/CatalogueContext";
import { PricingPlan } from "@quicktalog/common";
import BusinessInfoSection from "./footer/BusinessInfoSection";
import InteractionSection from "./footer/InteractionSection";
import LogoSizeSection from "./footer/LogoSizeSection";
import PartnersSection from "./footer/PartnersSection";
import SocialLinksSection from "./footer/SocialLinksSection";
import LimitsOverlay from "./LimitsOverlay";

const FooterTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;

	if (!catalogue || !updateCatalogue) return null;

	const handleChange = (field: string, value: any) => {
		if (field.startsWith("footer.cta.")) {
			const key = field.split(".")[2];
			updateCatalogue({
				footer: {
					...catalogue.footer,
					cta: {
						...catalogue.footer.cta,
						[key]: value,
					},
				},
			});
		} else if (field.startsWith("footer.logoSize.")) {
			const key = field.split(".")[2];
			const currentSize = catalogue.footer?.logoSize || {
				width: 120,
				height: 40,
			};
			updateCatalogue({
				footer: {
					...catalogue.footer,
					logoSize: {
						...currentSize,
						[key]: value,
					},
				},
			});
		} else if (field.startsWith("footer.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				footer: {
					...catalogue.footer,
					[key]: value,
				},
			});
		} else if (field.startsWith("legal.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				legal: {
					...catalogue.legal,
					[key]: value,
				},
			});
		}
	};

	return (
		<div
			className={`relative w-full ${!hasBranding ? "h-[calc(100dvh-250px)] sm:h-[calc(100dvh-200px)] overflow-hidden" : "h-full"}`}
		>
			{!hasBranding && <LimitsOverlay size="lg" type="branding" />}
			<div
				className={`space-y-4 p-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
			>
				<LogoSizeSection catalogue={catalogue} handleChange={handleChange} />

				<div className="w-full h-[1px] bg-border" />

				<InteractionSection
					catalogue={catalogue}
					handleChange={handleChange}
					plan={plan}
				/>

				<div className="w-full h-[1px] bg-border" />

				<BusinessInfoSection
					catalogue={catalogue}
					handleChange={handleChange}
				/>

				<div className="w-full h-[1px] bg-border" />

				<SocialLinksSection
					catalogue={catalogue}
					updateCatalogue={updateCatalogue}
				/>

				<div className="w-full h-[1px] bg-border" />

				<PartnersSection
					catalogue={catalogue}
					handleChange={handleChange}
					updateCatalogue={updateCatalogue}
				/>
			</div>
		</div>
	);
};

export default FooterTab;
