"use client";

import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	customThemeColorsEqual,
	DEFAULT_CUSTOM_COLORS,
	isDarkTheme,
	readPaletteFromElement,
} from "@/lib/themes/custom-theme";
import { useSavedThemes } from "@/hooks/useSavedThemes";
import type {
	CatalogueBackground,
	CustomThemeColors,
	GlassSettings,
	PricingPlan,
	SavedTheme,
} from "@quicktalog/common";
import { useState } from "react";
import BackgroundConfiguration from "./appearance/BackgroundConfiguration";
import CustomThemeConfiguration from "./appearance/CustomThemeConfiguration";
import GlassConfiguration from "./appearance/GlassConfiguration";
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
		update: updateTheme,
		remove: removeTheme,
	} = useSavedThemes();
	// The saved theme the custom panel edits, tracked by id so changing a colour
	// doesn't turn it into a "new" theme. `undefined` until the owner picks one
	// (a saved theme matching the colours on screen counts); `null` is a new theme.
	const [editingThemeId, setEditingThemeId] = useState<
		string | null | undefined
	>(undefined);
	const hasStyles = plan?.features?.apperance?.styles;
	const hasCustomThemes = plan?.features?.apperance?.customThemes;

	if (!catalogue || !updateCatalogue || !updateAppearance || !updateThemeColors)
		return null;

	const currentThemeName = catalogue.appearance?.theme?.name;
	const isCustomActive = catalogue.appearance?.theme?.type === "custom";
	const customColors = catalogue.appearance?.theme?.colors;
	const editingTheme: SavedTheme | undefined = !isCustomActive
		? undefined
		: editingThemeId === undefined
			? savedThemes.find((saved) =>
					customThemeColorsEqual(saved.colors, customColors),
				)
			: savedThemes.find((saved) => saved.id === editingThemeId);
	const currentStyle = catalogue.appearance?.style || ({} as any);
	const currentOverlay = catalogue.appearance?.overlay || ({} as any);

	const handleThemeSelect = (themeKey: string) => {
		setEditingThemeId(undefined);
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
		// The Custom tile only shows on plans with custom themes. Checking again
		// here keeps the "Started a new custom theme" toast off every other plan.
		if (!hasCustomThemes) return;
		// From a standard theme, seed from what's on screen so it looks intentional.
		// From a custom theme, the DOM already reflects it, so reset to neutral
		// defaults instead - "Custom" always starts fresh.
		const seeded = isCustomActive
			? DEFAULT_CUSTOM_COLORS
			: readPaletteFromElement(document.querySelector('[role="application"]'));
		setEditingThemeId(null);
		updateThemeColors(seeded);
		toast.success(
			"Started a new custom theme. Customize the colors below, then save it to reuse later.",
		);
		scrollToCustomPanel();
	};

	const handleSavedThemeSelect = (saved: SavedTheme) => {
		setEditingThemeId(saved.id);
		updateThemeColors(saved.colors);
	};

	const handleDeleteSavedTheme = async (id: string) => {
		const res = await removeTheme(id);
		if (!res.success) toast.error(res.error || "Failed to delete theme");
		// The colours stay on the catalogue as a new, unsaved theme.
		else if (id === editingTheme?.id) setEditingThemeId(null);
	};

	/** Saves over the theme being edited, or as a new one. */
	const handleSaveTheme = async (name: string, colors: CustomThemeColors) => {
		const res = editingTheme
			? await updateTheme(editingTheme.id, name, colors)
			: await saveTheme(name, colors);
		if (res.success && res.data) setEditingThemeId(res.data.id);
		return res;
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

	const handleBackgroundChange = (background: CatalogueBackground) => {
		updateCatalogue({ appearance: { ...catalogue.appearance, background } });
	};

	const handleGlassChange = (glass: GlassSettings) => {
		updateCatalogue({ appearance: { ...catalogue.appearance, glass } });
	};

	return (
		<div className={cn("space-y-4", PANEL_TAB_ROOT)}>
			<PanelSection
				info="Select the overall visual theme for your catalogue."
				title="Themes"
			>
				<ThemeSelection
					activeSavedThemeId={editingTheme?.id}
					allowCustom={Boolean(hasCustomThemes)}
					currentThemeName={currentThemeName}
					isCustomActive={isCustomActive}
					onCustomSelect={handleCustomSelect}
					onDeleteSavedTheme={handleDeleteSavedTheme}
					onSavedThemeSelect={handleSavedThemeSelect}
					onThemeSelect={handleThemeSelect}
					savedThemes={savedThemes}
				/>
			</PanelSection>

			{isCustomActive && (
				<PanelSection
					className="scroll-mt-4"
					id="custom-theme-panel"
					info="Pick each color of your theme, then save it to reuse it on other catalogues."
					title="Custom colors"
				>
					<LockedGroup locked={!hasCustomThemes} overlaySize="default">
						<CustomThemeConfiguration
							colors={customColors || {}}
							editingTheme={editingTheme}
							onColorsChange={updateThemeColors}
							onSave={handleSaveTheme}
						/>
					</LockedGroup>
				</PanelSection>
			)}

			<PanelSection
				id="panel-background"
				info="Replace the theme's background with your own photo, a gradient or a single colour. Cards, headers and text keep the theme's colours. Photos and gradients also give the glass effect something to show through."
				isNew
				title="Background"
			>
				<LockedGroup locked={!hasStyles} overlaySize="default">
					<BackgroundConfiguration
						background={catalogue.appearance?.background}
						onChange={handleBackgroundChange}
						themeIsDark={isDarkTheme(catalogue.appearance?.theme)}
					/>
				</LockedGroup>
			</PanelSection>

			<PanelSection
				info="Customize fonts, rounded corners, shadows and the glass effect."
				title="Style"
			>
				<LockedGroup locked={!hasStyles} overlaySize="default">
					<div className="space-y-5">
						<StyleConfiguration
							currentStyle={currentStyle}
							onStyleChange={handleStyleChange}
						/>
						<GlassConfiguration
							glass={catalogue.appearance?.glass}
							onChange={handleGlassChange}
						/>
					</div>
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
