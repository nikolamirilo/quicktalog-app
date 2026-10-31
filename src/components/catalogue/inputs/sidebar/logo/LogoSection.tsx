import {
	PanelSection,
	PanelShortcut,
	SliderField,
} from "@/components/catalogue/inputs/sidebar/panel";
import {
	LOGO_MAX_HEIGHT,
	LOGO_RADIUS_MAX,
	LOGO_SCALE,
	type LogoScope,
	logoRadiusOf,
	logoScaleOf,
} from "@/lib/catalogue/logo";
import { cn } from "@/lib/ui/cn";
import type { Catalogue } from "@quicktalog/common";

interface LogoSectionProps {
	catalogue: Catalogue;
	scope: LogoScope;
	handleChange: (field: string, value: number) => void;
	/** Switches the panel to General and scrolls to the logo upload. */
	onOpenLogo: () => void;
}

/** How big the logo draws, and how round it is. Inert until a logo exists. */
const LogoSection = ({
	catalogue,
	scope,
	handleChange,
	onOpenLogo,
}: LogoSectionProps) => {
	const hasLogo = Boolean(catalogue.logo);
	const scale = logoScaleOf(catalogue[scope]);
	const radius = logoRadiusOf(catalogue[scope]);

	return (
		<PanelSection
			info={`How big the logo draws in your ${scope}, and how round its corners are.`}
			title="Logo"
		>
			{!hasLogo && (
				<div className="space-y-2">
					<p className="text-[12.5px] leading-snug text-product-muted">
						No logo yet. Upload one and these settings become available.
					</p>
					<PanelShortcut label="Upload a logo" onClick={onOpenLogo} />
				</div>
			)}
			<div
				className={cn(
					"space-y-4",
					!hasLogo && "pointer-events-none select-none opacity-50",
				)}
				inert={!hasLogo || undefined}
			>
				<SliderField
					info={`A share of what the ${scope} allows, so 100% draws it ${LOGO_MAX_HEIGHT[scope]}px tall${scope === "header" ? " - less on phones, where the navbar is tighter" : ""}.`}
					label="Logo size"
					max={LOGO_SCALE.max}
					min={LOGO_SCALE.min}
					onValueChange={(value) => handleChange(`${scope}.logoScale`, value)}
					step={5}
					value={scale}
					valueText={`${scale}%`}
				/>
				<SliderField
					info="Rounds the logo's corners. At 100% a square logo becomes a circle."
					label="Corner rounding"
					max={LOGO_RADIUS_MAX}
					min={0}
					onValueChange={(value) => handleChange(`${scope}.logoRadius`, value)}
					step={5}
					value={radius}
					valueText={radius === 0 ? "Square" : `${radius}%`}
				/>
			</div>
		</PanelSection>
	);
};

export default LogoSection;
