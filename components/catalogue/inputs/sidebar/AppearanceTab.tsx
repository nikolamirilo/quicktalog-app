"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	customThemeColorsEqual,
	DEFAULT_CUSTOM_COLORS,
	readPaletteFromElement,
} from "@/helpers/theme";
import { useSavedThemes } from "@/hooks/useSavedThemes";
import { PricingPlan } from "@quicktalog/common";
import { Info } from "lucide-react";
import LimitsOverlay from "./LimitsOverlay";
import CustomThemeConfiguration from "./appearance/CustomThemeConfiguration";
import OverlayConfiguration from "./appearance/OverlayConfiguration";
import StyleConfiguration from "./appearance/StyleConfiguration";
import ThemeSelection from "./appearance/ThemeSelection";
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
		<div className="space-y-4 p-2">
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

			{isCustomActive && (
				<div className="relative w-full" id="custom-theme-panel">
					{!hasCustomThemes && <LimitsOverlay />}
					<div
						className={`space-y-4 ${!hasCustomThemes ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
					>
						<h3 className="text-lg font-bold">Custom colors</h3>
						<CustomThemeConfiguration
							activeSavedThemeName={activeSavedTheme?.name}
							colors={catalogue.appearance.theme.colors || {}}
							onColorsChange={updateThemeColors}
							onSave={saveTheme}
						/>
					</div>
				</div>
			)}

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
