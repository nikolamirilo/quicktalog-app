"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	crimsonText,
	inter,
	loraRegular,
	nunito,
	playfairDisplay,
	poppins,
} from "@/fonts";

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

export interface StyleConfigurationProps {
	currentStyle: Record<string, any>;
	onStyleChange: (field: string, value: any) => void;
}

// Helper to get slider index from string value
const getSliderValue = (options: string[], value: string) => {
	const index = options.indexOf(value);
	return index === -1 ? 0 : index;
};

const StyleConfiguration = ({
	currentStyle,
	onStyleChange,
}: StyleConfigurationProps) => {
	return (
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
							onValueChange={(value) => onStyleChange("fontFamily", value)}
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
						onStyleChange("contentFontSize", FONT_SIZES[vals[0]])
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
					onValueChange={(vals) => onStyleChange("borderRadius", vals[0])}
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
					onValueChange={(vals) => onStyleChange("shadow", SHADOWS[vals[0]])}
					step={1}
					value={[getSliderValue(SHADOWS, currentStyle.shadow || "low")]}
				/>
				<div className="flex justify-between text-xs text-muted-foreground px-1">
					<span>None</span>
					<span>High</span>
				</div>
			</div>
		</div>
	);
};

export default StyleConfiguration;
