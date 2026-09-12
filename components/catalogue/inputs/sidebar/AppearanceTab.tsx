"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { readPaletteFromElement } from "@/helpers/theme";
import { PricingPlan } from "@quicktalog/common";
import { Info } from "lucide-react";
import LimitsOverlay from "./LimitsOverlay";
import CustomThemeConfiguration from "./appearance/CustomThemeConfiguration";
import OverlayConfiguration from "./appearance/OverlayConfiguration";
import StyleConfiguration from "./appearance/StyleConfiguration";
import ThemeSelection from "./appearance/ThemeSelection";

const AppearanceTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue, updateAppearance, updateThemeColors } =
		useCatalogueContext() || {};
	const hasStyles = plan?.features?.apperance?.styles;
	const hasCustomThemes = plan?.features?.apperance?.customThemes;

	if (!catalogue || !updateCatalogue || !updateAppearance || !updateThemeColors)
		return null;

	const currentThemeName = catalogue.appearance?.theme?.name;
	const isCustomActive = catalogue.appearance?.theme?.type === "custom";
	const currentStyle = catalogue.appearance?.style || ({} as any);
	const currentOverlay = catalogue.appearance?.overlay || ({} as any);

	const handleThemeSelect = (themeKey: string) => {
		updateCatalogue({
			appearance: {
				...catalogue.appearance,
				theme: {
					name: themeKey,
					type: "standard",
				},
			},
		});
	};

	const handleCustomSelect = () => {
		if (isCustomActive) return;
		const seeded = readPaletteFromElement(
			document.querySelector('[role="application"]'),
		);
		updateThemeColors(seeded);
	};

	const handleStyleChange = (field: string, value: any) => {
		updateAppearance({
			[field]: value,
		});
	};

	const handleOverlayChange = (field: string, value: any) => {
		updateCatalogue({
			appearance: {
				...catalogue.appearance,
				overlay: {
					...currentOverlay,
					[field]: value,
				},
			},
		});
	};

	return (
		<div className="space-y-4 p-2">
			{/* Themes Section */}
			<ThemeSelection
				currentThemeName={currentThemeName}
				isCustomActive={isCustomActive}
				onCustomSelect={handleCustomSelect}
				onThemeSelect={handleThemeSelect}
			/>

			{isCustomActive && (
				<div className="relative w-full">
					{!hasCustomThemes && <LimitsOverlay />}
					<div
						className={`space-y-4 ${!hasCustomThemes ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
					>
						<h3 className="text-lg font-bold">Custom colors</h3>
						<CustomThemeConfiguration
							colors={catalogue.appearance.theme.colors || {}}
							onColorsChange={updateThemeColors}
						/>
					</div>
				</div>
			)}

			{/* Style + Overlay Section */}
			<div className="relative w-full">
				{!hasStyles && <LimitsOverlay />}
				<div
					className={`space-y-4 ${!hasStyles ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
				>
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Style</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Customize fonts, rounded corners, shadows, and overlay.</p>
							</PopoverContent>
						</Popover>
					</div>

					<StyleConfiguration
						currentStyle={currentStyle}
						onStyleChange={handleStyleChange}
					/>

					<OverlayConfiguration
						currentOverlay={currentOverlay}
						onOverlayChange={handleOverlayChange}
					/>
				</div>
			</div>
		</div>
	);
};

export default AppearanceTab;
