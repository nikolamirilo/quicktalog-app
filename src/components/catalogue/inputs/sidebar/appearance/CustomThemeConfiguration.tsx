"use client";

import { Palette, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	CUSTOM_COLOR_KEYS,
	DEFAULT_CUSTOM_COLORS,
} from "@/lib/themes/custom-theme";
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
			<p className="flex items-center gap-2 rounded-xl bg-product-background-hero px-3 py-2 text-[13px] text-product-foreground-accent">
				{activeSavedThemeName ? (
					<>
						<Palette aria-hidden="true" className="h-4 w-4 shrink-0" />
						<span>
							Editing{" "}
							<strong className="font-semibold text-product-foreground">
								{activeSavedThemeName}
							</strong>
						</span>
					</>
				) : (
					<>
						<Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
						<span>New custom theme. Save it below to reuse it later.</span>
					</>
				)}
			</p>

			<ul className="divide-y divide-product-border">
				{CUSTOM_COLOR_KEYS.map((key) => {
					const value = colors[key] ?? DEFAULT_CUSTOM_COLORS[key];
					const inputId = `custom-color-${key}`;
					return (
						<li
							className="flex min-h-12 items-center justify-between gap-3 py-1"
							key={key}
						>
							<Label className="min-w-0 truncate" htmlFor={inputId}>
								{COLOR_LABELS[key]}
							</Label>
							<div className="flex shrink-0 items-center gap-2">
								{/* The swatch is the native picker, sized as a 44px target. */}
								<span
									className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-product-border-strong shadow-sm"
									style={{ backgroundColor: value }}
								>
									<input
										aria-label={`${COLOR_LABELS[key]} colour picker`}
										className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
										onChange={(e) => handleColorChange(key, e.target.value)}
										type="color"
										value={value}
									/>
								</span>
								<Input
									autoComplete="off"
									className="h-11 w-[104px] px-3 font-mono text-sm uppercase md:text-sm"
									id={inputId}
									maxLength={7}
									onChange={(e) => handleColorChange(key, e.target.value)}
									spellCheck={false}
									value={value}
								/>
							</div>
						</li>
					);
				})}
			</ul>

			<form
				className="space-y-2 border-t border-product-border pt-4"
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
			>
				<Label htmlFor="custom-theme-name">Theme name</Label>
				<div className="flex gap-2">
					<Input
						className="min-w-0 flex-1"
						disabled={isSaving}
						id="custom-theme-name"
						onChange={(e) => setNewThemeName(e.target.value)}
						placeholder="e.g. Summer menu"
						value={newThemeName}
					/>
					<Button className="shrink-0" disabled={isSaving} type="submit">
						{activeSavedThemeName ? "Update" : "Save"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default CustomThemeConfiguration;
