"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SliderField } from "@/components/catalogue/inputs/sidebar/panel";
import {
	crimsonText,
	dmSans,
	inter,
	josefinSans,
	lato,
	loraRegular,
	merriweather,
	montserrat,
	nunito,
	openSans,
	oswald,
	playfairDisplay,
	poppins,
	raleway,
	roboto,
	robotoSlab,
	sourceSans3,
	workSans,
} from "@/lib/fonts";

const FONT_OPTIONS = [
	{ label: "Inter", value: "inter", className: inter.className },
	{ label: "Arial", value: "arial", className: "font-sans" },
	{ label: "Roboto", value: "roboto", className: roboto.className },
	{ label: "Open Sans", value: "open-sans", className: openSans.className },
	{ label: "Montserrat", value: "montserrat", className: montserrat.className },
	{ label: "Lato", value: "lato", className: lato.className },
	{ label: "Poppins", value: "poppins", className: poppins.className },
	{ label: "Nunito", value: "nunito", className: nunito.className },
	{ label: "Raleway", value: "raleway", className: raleway.className },
	{ label: "Oswald", value: "oswald", className: oswald.className },
	{ label: "Lora", value: "lora", className: loraRegular.className },
	{
		label: "Playfair Display",
		value: "playfair",
		className: playfairDisplay.className,
	},
	{
		label: "Merriweather",
		value: "merriweather",
		className: merriweather.className,
	},
	{
		label: "Roboto Slab",
		value: "roboto-slab",
		className: robotoSlab.className,
	},
	{
		label: "Crimson Text",
		value: "crimson",
		className: crimsonText.className,
	},
	{
		label: "Source Sans 3",
		value: "source-sans",
		className: sourceSans3.className,
	},
	{ label: "Work Sans", value: "work-sans", className: workSans.className },
	{ label: "DM Sans", value: "dm-sans", className: dmSans.className },
	{
		label: "Josefin Sans",
		value: "josefin-sans",
		className: josefinSans.className,
	},
];

const FONT_SIZES = ["small", "medium", "large"];
const SHADOWS = ["none", "low", "medium", "high"];

interface StyleConfigurationProps {
	currentStyle: Record<string, any>;
	onStyleChange: (field: string, value: any) => void;
}

const getSliderValue = (options: string[], value: string) => {
	const index = options.indexOf(value);
	return index === -1 ? 0 : index;
};

const StyleConfiguration = ({
	currentStyle,
	onStyleChange,
}: StyleConfigurationProps) => {
	const isValidFont = FONT_OPTIONS.some(
		(f) => f.value === currentStyle.fontFamily,
	);
	const fontFamily = isValidFont ? currentStyle.fontFamily : "inter";
	const fontSize = currentStyle.contentFontSize || "medium";
	const radius = currentStyle.borderRadius ?? 12;
	const shadow = currentStyle.shadow || "low";

	return (
		<div className="space-y-5">
			<div className="space-y-2">
				<Label htmlFor="appearance-font">Font style</Label>
				{/* Each option is drawn in its own font: a preview of the catalogue. */}
				<Select
					onValueChange={(value) => onStyleChange("fontFamily", value)}
					value={fontFamily}
				>
					<SelectTrigger id="appearance-font">
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
			</div>

			<SliderField
				label="Content font size"
				marks={["Small", "Medium", "Large"]}
				max={2}
				min={0}
				onValueChange={(value) =>
					onStyleChange("contentFontSize", FONT_SIZES[value])
				}
				step={1}
				value={getSliderValue(FONT_SIZES, fontSize)}
				valueText={fontSize}
			/>

			<SliderField
				label="Corner radius"
				max={16}
				min={0}
				onValueChange={(value) => onStyleChange("borderRadius", value)}
				step={1}
				value={radius}
				valueText={`${radius}px`}
			/>

			<SliderField
				label="Shadow"
				marks={["None", "High"]}
				max={3}
				min={0}
				onValueChange={(value) => onStyleChange("shadow", SHADOWS[value])}
				step={1}
				value={getSliderValue(SHADOWS, shadow)}
				valueText={shadow}
			/>
		</div>
	);
};

export default StyleConfiguration;
