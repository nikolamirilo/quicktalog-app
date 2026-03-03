"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { PricingPlan, themes } from "@quicktalog/common";
import { Info } from "lucide-react";
import { useState } from "react";
import LimitsOverlay from "./LimitsOverlay";

const FONT_OPTIONS = [
	{ label: "Inter", value: "inter", className: inter.className },
	{ label: "Arial", value: "arial", className: "font-sans" },
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
const SHADOWS = ["none", "low", "medium", "high"];

const AppearanceTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue, updateAppearance } =
		useCatalogueContext() || {};
	const hasStyles = plan?.features?.apperance?.styles;
	const [visibleCount, setVisibleCount] = useState(3);

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

	const sortedThemes = [...themes].sort((a, b) => a.id - b.id);
	const visibleThemes = sortedThemes.slice(0, visibleCount);

	// Helper to get slider index from string value
	const getSliderValue = (options: string[], value: string) => {
		const index = options.indexOf(value);
		return index === -1 ? 0 : index;
	};

	return (
		<div className="space-y-4 p-2">
			{/* Themes Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold">Themes</h3>
					<Popover>
						<PopoverTrigger type="button">
							<Info className="h-4 w-4 text-muted-foreground" />
						</PopoverTrigger>
						<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
							<p>Select the overall visual theme for your catalogue.</p>
						</PopoverContent>
					</Popover>
				</div>

				<div className="grid grid-cols-3 gap-2">
					{visibleThemes.map((themeItem) => {
						const isSelected = currentThemeName === themeItem.key;
						return (
							<button
								className={`flex flex-col items-center justify-center p-3 w-full h-24 rounded-lg transition-all duration-300 ease-in-out hover:scale-[1.02] ${themeItem.key
									} ${isSelected
										? "border-product-primary shadow-md scale-[1.03] border-[3px]"
										: "hover:shadow-sm border border-border"
									}`}
								key={themeItem.key}
								onClick={() => handleThemeSelect(themeItem.key)}
								style={{
									borderColor: isSelected
										? "var(--product-primary)"
										: "var(--catalogue-section-border)",
									backgroundColor: "var(--catalogue-background)",
									color: "var(--catalogue-foreground)",
									fontFamily: "var(--catalogue-font-body)",
								}}
								type="button"
							>
								{/* Preview Circle */}
								<div
									className="w-8 h-8 mb-2 rounded-full border-2"
									style={{
										backgroundColor: "var(--catalogue-primary)",
										borderColor: "var(--catalogue-foreground)",
									}}
								/>
								<span
									className="text-xs font-medium"
									style={{
										color: "var(--catalogue-heading)",
										fontFamily: "var(--catalogue-font-heading)",
										fontWeight: "var(--catalogue-weight-heading)",
										letterSpacing: "var(--catalogue-spacing-heading)",
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
						className="w-full"
						onClick={() => setVisibleCount((prev) => prev + 6)}
						variant="outline"
					>
						Show more
					</Button>
				)}
				{visibleCount > sortedThemes.length && (
					<Button
						className="w-full"
						onClick={() => setVisibleCount(3)}
						variant="outline"
					>
						Show less
					</Button>
				)}
			</div>

			{/* Style + Overlay Section */}
			<div className="relative w-full">
				{!hasStyles && <LimitsOverlay />}
				<div className={`space-y-4 ${!hasStyles ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}>
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Style</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
								<p>Customize fonts, rounded corners, shadows, and overlay.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-6">
						{/* Font Family */}
						<div className="space-y-2">
							<Label>Font Style</Label>
							{(() => {
								const isValidFont = FONT_OPTIONS.some(
									(f) => f.value === currentStyle.fontFamily,
								);
								const computedFontFamily = isValidFont
									? currentStyle.fontFamily
									: "inter";
								return (
									<Select
										onValueChange={(value) =>
											handleStyleChange("fontFamily", value)
										}
										value={computedFontFamily}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select font" />
										</SelectTrigger>
										<SelectContent>
											{FONT_OPTIONS.map((font) => (
												<SelectItem
													className={font.className}
													key={font.value}
													value={font.value}
												>
													<span className={font.className}>{font.label}</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								);
							})()}
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
								max={2}
								min={0}
								onValueChange={(vals) =>
									handleStyleChange("contentFontSize", FONT_SIZES[vals[0]])
								}
								step={1}
								value={[
									getSliderValue(
										FONT_SIZES,
										currentStyle.contentFontSize || "medium",
									),
								]}
							/>
							<div className="flex justify-between text-xs text-muted-foreground px-1">
								<span>Small</span>
								<span>Medium</span>
								<span>Large</span>
							</div>
						</div>

						{/* Corner Radius */}
						<div className="space-y-2">
							<div className="flex justify-between">
								<Label>Corner radius</Label>
								<span className="text-sm text-muted-foreground">
									{currentStyle.borderRadius ?? 12}px
								</span>
							</div>
							<Slider
								max={16}
								min={0}
								onValueChange={(vals) =>
									handleStyleChange("borderRadius", vals[0])
								}
								step={1}
								value={[currentStyle.borderRadius ?? 12]}
							/>
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
								max={3}
								min={0}
								onValueChange={(vals) =>
									handleStyleChange("shadow", SHADOWS[vals[0]])
								}
								step={1}
								value={[getSliderValue(SHADOWS, currentStyle.shadow || "low")]}
							/>
							<div className="flex justify-between text-xs text-muted-foreground px-1">
								<span>None</span>
								<span>High</span>
							</div>
						</div>

						{/* Overlay */}
						<div className="space-y-4 pt-2">
							<div className="flex items-center gap-2">
								<Label className="text-base font-semibold">Overlay</Label>
								<Popover>
									<PopoverTrigger type="button">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
										<p>Add a floating icon overlay to your catalogue.</p>
									</PopoverContent>
								</Popover>
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
											onChange={(e) => handleOverlayChange("icon", e.target.value)}
											placeholder="e.g. 🎁"
											value={currentOverlay.icon || ""}
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AppearanceTab;