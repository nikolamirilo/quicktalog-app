"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import {
	crimsonText,
	inter,
	loraRegular,
	nunito,
	playfairDisplay,
	poppins,
} from "@/fonts";
import { themes } from "@quicktalog/common";
import { useState } from "react";

const FONT_OPTIONS = [
	{ label: "Arial", value: "arial", className: "font-sans" },
	{ label: "Inter", value: "inter", className: inter.className },
	{ label: "Lora", value: "lora", className: loraRegular.className },
	{ label: "Nunito", value: "nunito", className: nunito.className },
	{
		label: "Playfair Display",
		value: "playfair",
		className: playfairDisplay.className,
	},
	{ label: "Poppins", value: "poppins", className: poppins.className },
	{
		label: "Crimson Text",
		value: "crimson",
		className: crimsonText.className,
	},
];

const FONT_SIZES = ["small", "medium", "large"];
const ANIMATIONS = ["none", "minimal", "medium", "full"];
const SHADOWS = ["none", "low", "medium", "high"];

const AppearanceTab = () => {
	const { catalogue, updateCatalogue, updateAppearance } =
		useCatalogueContext() || {};
	const [visibleCount, setVisibleCount] = useState(3);

	if (!catalogue || !updateCatalogue) return null;

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

	const sortedThemes = [...themes].sort((a, b) => a.id - b.id);
	const visibleThemes = sortedThemes.slice(0, visibleCount);

	// Helper to get slider index from string value
	const getSliderValue = (options: string[], value: string) => {
		const index = options.indexOf(value);
		return index === -1 ? 0 : index;
	};

	return (
		<div className="space-y-8 p-4">
			{/* Themes Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="font-serif text-xl font-medium">Themes</h3>
				</div>

				<div className="grid grid-cols-3 gap-2">
					{visibleThemes.map((themeItem) => {
						const isSelected = currentThemeName === themeItem.key;
						return (
							<button
								key={themeItem.key}
								type="button"
								onClick={() => handleThemeSelect(themeItem.key)}
								className={`flex flex-col items-center justify-center p-3 w-full h-24 rounded-lg transition-all duration-300 ease-in-out hover:scale-[1.02] ${
									themeItem.key
								} ${
									isSelected
										? "border-product-primary shadow-md scale-[1.03] border-[3px]"
										: "hover:shadow-sm border border-border"
								}`}
								style={{
									borderColor: isSelected
										? "var(--product-primary)"
										: "var(--section-border)",
									backgroundColor: "var(--background)",
									color: "var(--foreground)",
									fontFamily: "var(--font-family-body)",
								}}
							>
								{/* Preview Circle */}
								<div
									className="w-8 h-8 mb-2 rounded-full border-2"
									style={{
										backgroundColor: "var(--primary)",
										borderColor: "var(--foreground)",
									}}
								/>
								<span
									className="text-xs font-medium"
									style={{
										color: "var(--heading)",
										fontFamily: "var(--font-family-heading)",
										fontWeight: "var(--font-weight-heading)",
										letterSpacing: "var(--letter-spacing-heading)",
									}}
								>
									{themeItem.label}
								</span>
							</button>
						);
					})}
				</div>

				{visibleCount < sortedThemes.length && (
					<Button
						variant="outline"
						onClick={() => setVisibleCount((prev) => prev + 6)}
						className="w-full"
					>
						Show more
					</Button>
				)}
				{visibleCount > sortedThemes.length && (
					<Button
						variant="outline"
						onClick={() => setVisibleCount(3)}
						className="w-full"
					>
						Show less
					</Button>
				)}
			</div>

			{/* Style Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="font-serif text-xl font-medium">Style</h3>
				</div>

				<div className="space-y-6">
					{/* Font Family */}
					<div className="space-y-2">
						<Label>Font Family</Label>
						<Select
							value={currentStyle.fontFamily || "arial"}
							onValueChange={(value) => handleStyleChange("fontFamily", value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select font family" />
							</SelectTrigger>
							<SelectContent>
								{FONT_OPTIONS.map((font) => (
									<SelectItem
										key={font.value}
										value={font.value}
										className={font.className}
									>
										<span className={font.className}>{font.label}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Content Font Size */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<Label>Content Font Size</Label>
							<span className="text-sm text-muted-foreground capitalize">
								{currentStyle.contentFontSize || "medium"}
							</span>
						</div>
						<Slider
							value={[
								getSliderValue(
									FONT_SIZES,
									currentStyle.contentFontSize || "medium",
								),
							]}
							min={0}
							max={2}
							step={1}
							onValueChange={(vals) =>
								handleStyleChange("contentFontSize", FONT_SIZES[vals[0]])
							}
						/>
						<div className="flex justify-between text-xs text-muted-foreground px-1">
							<span>Small</span>
							<span>Medium</span>
							<span>Large</span>
						</div>
					</div>

					{/* Border Radius */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<Label>Border Radius</Label>
							<span className="text-sm text-muted-foreground">
								{currentStyle.borderRadius ?? 12}px
							</span>
						</div>
						<Slider
							value={[currentStyle.borderRadius ?? 12]}
							min={0}
							max={16}
							step={1}
							onValueChange={(vals) =>
								handleStyleChange("borderRadius", vals[0])
							}
						/>
					</div>

					{/* Animation */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<Label>Animation</Label>
							<span className="text-sm text-muted-foreground capitalize">
								{currentStyle.animation || "minimal"}
							</span>
						</div>
						<Slider
							value={[
								getSliderValue(ANIMATIONS, currentStyle.animation || "minimal"),
							]}
							min={0}
							max={3}
							step={1}
							onValueChange={(vals) =>
								handleStyleChange("animation", ANIMATIONS[vals[0]])
							}
						/>
						<div className="flex justify-between text-xs text-muted-foreground px-1">
							<span>None</span>
							<span>Full</span>
						</div>
					</div>

					{/* Shadow */}
					<div className="space-y-2">
						<div className="flex justify-between">
							<Label>Shadow</Label>
							<span className="text-sm text-muted-foreground capitalize">
								{currentStyle.shadow || "low"}
							</span>
						</div>
						<Slider
							value={[getSliderValue(SHADOWS, currentStyle.shadow || "low")]}
							min={0}
							max={3}
							step={1}
							onValueChange={(vals) =>
								handleStyleChange("shadow", SHADOWS[vals[0]])
							}
						/>
						<div className="flex justify-between text-xs text-muted-foreground px-1">
							<span>None</span>
							<span>High</span>
						</div>
					</div>
				</div>
			</div>

			{/* Overlay Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="font-serif text-xl font-medium">Overlay</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Label>Enable Overlay</Label>
						<Switch
							checked={currentOverlay.isEnabled || false}
							onCheckedChange={(checked) =>
								handleOverlayChange("isEnabled", checked)
							}
						/>
					</div>

					{currentOverlay.isEnabled && (
						<div className="space-y-2">
							<Label>Overlay Icon</Label>
							<Input
								placeholder="e.g. 🎁"
								value={currentOverlay.icon || ""}
								onChange={(e) => handleOverlayChange("icon", e.target.value)}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AppearanceTab;
