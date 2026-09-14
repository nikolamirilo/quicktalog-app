"use client";

import { Palette, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { CUSTOM_COLOR_KEYS, DEFAULT_CUSTOM_COLORS } from "@/helpers/theme";
import type { CustomThemeColors } from "@quicktalog/common";

const COLOR_LABELS: Record<(typeof CUSTOM_COLOR_KEYS)[number], string> = {
	background: "Background",
	heading: "Heading",
	text: "Text",
	primary: "Primary",
	secondary: "Secondary",
	cardBackground: "Card background",
};

interface CustomThemeConfigurationProps {
	colors: CustomThemeColors;
	onColorsChange: (colors: CustomThemeColors) => void;
	onSave: (
		name: string,
		colors: CustomThemeColors,
	) => Promise<{ success: boolean; error?: string }>;
	/** Name of the saved theme these colors still match, if any. */
	activeSavedThemeName?: string;
}

const CustomThemeConfiguration = ({
	colors,
	onColorsChange,
	onSave,
	activeSavedThemeName,
}: CustomThemeConfigurationProps) => {
	const [newThemeName, setNewThemeName] = useState(activeSavedThemeName ?? "");
	const [isSaving, setIsSaving] = useState(false);

	// Re-sync the name field whenever the edit moves onto a different saved
	// theme, or off one entirely, so the field never shows a stale name.
	useEffect(() => {
		setNewThemeName(activeSavedThemeName ?? "");
	}, [activeSavedThemeName]);

	const handleColorChange = (
		key: (typeof CUSTOM_COLOR_KEYS)[number],
		value: string,
	) => {
		onColorsChange({ ...colors, [key]: value });
	};

	const handleSave = async () => {
		if (!newThemeName.trim()) {
			toast.error("Give your theme a name first");
			return;
		}
		setIsSaving(true);
		const res = await onSave(newThemeName, colors);
		setIsSaving(false);
		if (res.success) {
			toast.success("Theme saved");
			setNewThemeName("");
		} else {
			toast.error(res.error || "Failed to save theme");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				{activeSavedThemeName ? (
					<>
						<Palette className="h-4 w-4 shrink-0" />
						<span>
							Editing{" "}
							<strong className="text-foreground">
								{activeSavedThemeName}
							</strong>
						</span>
					</>
				) : (
					<>
						<Sparkles className="h-4 w-4 shrink-0" />
						<span>New custom theme - save it below to reuse it later.</span>
					</>
				)}
			</div>

			<div className="space-y-1">
				{CUSTOM_COLOR_KEYS.map((key) => (
					<ColorPicker
						key={key}
						label={COLOR_LABELS[key]}
						onChange={(value) => handleColorChange(key, value)}
						value={colors[key] ?? DEFAULT_CUSTOM_COLORS[key]}
					/>
				))}
			</div>

			<div className="flex gap-2">
				<Input
					disabled={isSaving}
					onChange={(e) => setNewThemeName(e.target.value)}
					placeholder="Theme name"
					value={newThemeName}
				/>
				<Button disabled={isSaving} onClick={handleSave} type="button">
					{activeSavedThemeName ? "Update" : "Save"}
				</Button>
			</div>
		</div>
	);
};

export default CustomThemeConfiguration;
