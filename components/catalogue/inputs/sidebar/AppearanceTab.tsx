"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { PricingPlan } from "@quicktalog/common";
import { Info } from "lucide-react";
import LimitsOverlay from "./LimitsOverlay";
import OverlayConfiguration from "./appearance/OverlayConfiguration";
import StyleConfiguration from "./appearance/StyleConfiguration";
import ThemeSelection from "./appearance/ThemeSelection";

const AppearanceTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue, updateAppearance } =
		useCatalogueContext() || {};
	const hasStyles = plan?.features?.apperance?.styles;

	if (!catalogue || !updateCatalogue || !updateAppearance) return null;

	const currentThemeName = catalogue.appearance?.theme?.name;
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
				onThemeSelect={handleThemeSelect}
			/>

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
								side="top"
								className="z-[2000] w-[200px] p-3 text-sm"
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
