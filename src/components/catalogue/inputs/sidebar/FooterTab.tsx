import { PricingPlan } from "@quicktalog/common";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { cn } from "@/lib/ui/cn";
import BusinessInfoSection from "./footer/BusinessInfoSection";
import InteractionSection from "./footer/InteractionSection";
import LogoSizeSection from "./footer/LogoSizeSection";
import PartnersSection from "./footer/PartnersSection";
import SocialLinksSection from "./footer/SocialLinksSection";
import LimitsOverlay from "./LimitsOverlay";
import { PANEL_TAB_ROOT, PanelSection } from "./panel";

const FooterTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;

	if (!catalogue || !updateCatalogue) return null;

	const isCustom = catalogue.footer?.type !== "default";

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
			className={cn(
				"relative w-full",
				PANEL_TAB_ROOT,
				!hasBranding &&
					"h-[calc(100dvh-250px)] overflow-hidden sm:h-[calc(100dvh-200px)]",
			)}
		>
			{!hasBranding && <LimitsOverlay size="lg" type="branding" />}
			<div
				className={cn(
					"space-y-4",
					!hasBranding && "pointer-events-none select-none opacity-30",
				)}
				inert={!hasBranding || undefined}
			>
				<PanelSection
					action={
						<Switch
							aria-describedby="footer-type-hint"
							aria-label="Customize footer"
							checked={isCustom}
							id="footer-type"
							onCheckedChange={(checked) => {
								handleChange("footer.type", checked ? "custom" : "default");
							}}
						/>
					}
					description={
						<span id="footer-type-hint">
							{isCustom
								? "Your settings below are used for the footer."
								: "Using the default footer. Turn this on to change it."}
						</span>
					}
					title="Customize footer"
				/>

				<div
					className={cn(
						"space-y-4",
						!isCustom && "pointer-events-none select-none opacity-50",
					)}
					inert={!isCustom || undefined}
				>
					<LogoSizeSection catalogue={catalogue} handleChange={handleChange} />

					<InteractionSection
						catalogue={catalogue}
						handleChange={handleChange}
						plan={plan}
					/>

					<BusinessInfoSection
						catalogue={catalogue}
						handleChange={handleChange}
					/>

					<SocialLinksSection
						catalogue={catalogue}
						updateCatalogue={updateCatalogue}
					/>

					<PartnersSection
						catalogue={catalogue}
						handleChange={handleChange}
						updateCatalogue={updateCatalogue}
					/>
				</div>
			</div>
		</div>
	);
};

export default FooterTab;
