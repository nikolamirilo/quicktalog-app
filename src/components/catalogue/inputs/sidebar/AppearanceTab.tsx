"use client";

import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	customThemeColorsEqual,
	DEFAULT_CUSTOM_COLORS,
	readPaletteFromElement,
} from "@/lib/themes/custom-theme";
import { useSavedThemes } from "@/hooks/useSavedThemes";
import { PricingPlan } from "@quicktalog/common";
import CustomThemeConfiguration from "./appearance/CustomThemeConfiguration";
import OverlayConfiguration from "./appearance/OverlayConfiguration";
import StyleConfiguration from "./appearance/StyleConfiguration";
import ThemeSelection from "./appearance/ThemeSelection";
import { LockedGroup, PANEL_TAB_ROOT, PanelSection } from "./panel";
import { cn } from "@/lib/ui/cn";
import { toast } from "sonner";

const AppearanceTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue, updateAppearance, updateThemeColors } =
		useCatalogueContext() || {};
	const {
		themes: savedThemes,
		save: saveTheme,
		remove: removeTheme,
	} = useSavedThemes();
	const hasStyles = plan?.features?.apperance?.styles;
	const hasCustomThemes = plan?.features?.apperance?.customThemes;

	if (!catalogue || !updateCatalogue || !updateAppearance || !updateThemeColors)
		return null;

	const currentThemeName = catalogue.appearance?.theme?.name;
	const isCustomActive = catalogue.appearance?.theme?.type === "custom";
	const activeSavedTheme = isCustomActive
		? savedThemes.find((saved) =>
				customThemeColorsEqual(saved.colors, catalogue.appearance.theme.colors),
			)
		: undefined;
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

	const scrollToCustomPanel = () => {
		requestAnimationFrame(() => {
			document
				.getElementById("custom-theme-panel")
				?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		});
	};

	const handleCustomSelect = () => {
		// From a standard theme, seed from what's on screen so it looks intentional.
		// From a custom theme, the DOM already reflects it, so reset to neutral
		// defaults instead - "Custom" always starts fresh.
		const seeded = isCustomActive
			? DEFAULT_CUSTOM_COLORS
			: readPaletteFromElement(document.querySelector('[role="application"]'));
		updateThemeColors(seeded);
		toast.success(
			"Started a new custom theme. Customize the colors below, then save it to reuse later.",
		);
		scrollToCustomPanel();
	};

	const handleDeleteSavedTheme = async (id: string) => {
		const res = await removeTheme(id);
		if (!res.success) toast.error(res.error || "Failed to delete theme");
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
		<div className={cn("space-y-4", PANEL_TAB_ROOT)}>
			<PanelSection
				info="Select the overall visual theme for your catalogue."
				title="Themes"
			>
				<ThemeSelection
					currentCustomColors={catalogue.appearance.theme.colors}
					currentThemeName={currentThemeName}
					isCustomActive={isCustomActive}
					onCustomSelect={handleCustomSelect}
					onDeleteSavedTheme={handleDeleteSavedTheme}
					onSavedThemeSelect={updateThemeColors}
					onThemeSelect={handleThemeSelect}
					savedThemes={savedThemes}
				/>
			</PanelSection>

			{isCustomActive && (
				<PanelSection
					className="scroll-mt-4"
					id="custom-theme-panel"
					info="Pick each colour of your theme, then save it to reuse it on other catalogues."
					title="Custom colours"
				>
					<LockedGroup locked={!hasCustomThemes} overlaySize="default">
						<CustomThemeConfiguration
							activeSavedThemeName={activeSavedTheme?.name}
							colors={catalogue.appearance.theme.colors || {}}
							onColorsChange={updateThemeColors}
							onSave={saveTheme}
						/>
					</LockedGroup>
				</PanelSection>
			)}

			<PanelSection
				info="Customize fonts, rounded corners and shadows."
				title="Style"
			>
				<LockedGroup locked={!hasStyles} overlaySize="default">
					<StyleConfiguration
						currentStyle={currentStyle}
						onStyleChange={handleStyleChange}
					/>
				</LockedGroup>
			</PanelSection>

			<PanelSection
				info="Add a floating icon overlay to your catalogue."
				title="Overlay"
			>
				<LockedGroup locked={!hasStyles}>
					<OverlayConfiguration
						currentOverlay={currentOverlay}
						onOverlayChange={handleOverlayChange}
					/>
				</LockedGroup>
			</PanelSection>
		</div>
	);
};

export default AppearanceTab;
