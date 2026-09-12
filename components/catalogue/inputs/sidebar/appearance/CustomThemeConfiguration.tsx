"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSavedThemes } from "@/hooks/useSavedThemes";
import { CUSTOM_COLOR_KEYS, DEFAULT_CUSTOM_COLORS } from "@/helpers/theme";
import type { CustomThemeColors } from "@quicktalog/common";
import { Trash2 } from "lucide-react";

const COLOR_LABELS: Record<(typeof CUSTOM_COLOR_KEYS)[number], string> = {
	background: "Background",
	heading: "Heading",
	text: "Text",
	primary: "Primary",
	secondary: "Secondary",
	cardBackground: "Card background",
};

export interface CustomThemeConfigurationProps {
	colors: CustomThemeColors;
	onColorsChange: (colors: CustomThemeColors) => void;
}

const CustomThemeConfiguration = ({
	colors,
	onColorsChange,
}: CustomThemeConfigurationProps) => {
	const { themes, isLoading, save, remove } = useSavedThemes();
	const [newThemeName, setNewThemeName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleColorChange = (
		key: (typeof CUSTOM_COLOR_KEYS)[number],
		value: string,
	) => {
		onColorsChange({ ...colors, [key]: value });
	};

	const handleApplySaved = (id: string) => {
		const saved = themes.find((t) => t.id === id);
		if (saved) onColorsChange(saved.colors);
	};

	const handleSave = async () => {
		if (!newThemeName.trim()) {
			toast.error("Give your theme a name first");
			return;
		}
		setIsSaving(true);
		const res = await save(newThemeName, colors);
		setIsSaving(false);
		if (res.success) {
			toast.success("Theme saved");
			setNewThemeName("");
		} else {
			toast.error(res.error || "Failed to save theme");
		}
	};

	const handleDelete = async (id: string) => {
		const res = await remove(id);
		if (!res.success) toast.error(res.error || "Failed to delete theme");
	};

	return (
		<div className="space-y-6">
			{themes.length > 0 && (
				<div className="space-y-2">
					<Label>Your saved themes</Label>
					<div className="flex flex-col gap-2">
						{themes.map((saved) => (
							<div className="flex items-center gap-2" key={saved.id}>
								<Button
									className="flex-1 justify-start"
									onClick={() => handleApplySaved(saved.id)}
									type="button"
									variant="outline"
								>
									<span
										className="w-4 h-4 rounded-full border mr-2 shrink-0"
										style={{
											backgroundColor:
												saved.colors.primary ?? DEFAULT_CUSTOM_COLORS.primary,
										}}
									/>
									{saved.name}
								</Button>
								<Button
									onClick={() => handleDelete(saved.id)}
									size="icon"
									type="button"
									variant="ghost"
								>
									<Trash2 className="w-4 h-4 text-destructive" />
								</Button>
							</div>
						))}
					</div>
				</div>
			)}

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

			<div className="space-y-2">
				<Label>Save this palette for reuse</Label>
				<div className="flex gap-2">
					<Input
						disabled={isSaving}
						onChange={(e) => setNewThemeName(e.target.value)}
						placeholder="Theme name"
						value={newThemeName}
					/>
					<Button
						disabled={isSaving || isLoading}
						onClick={handleSave}
						type="button"
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	);
};

export default CustomThemeConfiguration;
