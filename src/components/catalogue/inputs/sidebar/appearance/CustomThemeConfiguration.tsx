"use client";

import type { CustomThemeColors, SavedTheme } from "@quicktalog/common";
import { CircleAlert, Palette, Pencil, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	customThemeColorsEqual,
	DEFAULT_CUSTOM_COLORS,
	isDarkBackground,
	isTextReadableOnCard,
} from "@/lib/themes/custom-theme";
import { ColorPicker } from "./ColorPicker";

type ColorKey =
	| "background"
	| "heading"
	| "cardBackground"
	| "text"
	| "primary";

/**
 * The colours an owner picks, named after what they change on the page.
 * Secondary has no picker: no catalogue element uses it, so the control did
 * nothing. Saved themes keep whatever value they had.
 */
const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
	{
		key: "background",
		label: "Page background",
		hint: "Behind the whole catalogue",
	},
	{
		key: "heading",
		label: "Titles",
		hint: "Catalogue name and section titles",
	},
	{
		key: "cardBackground",
		label: "Card background",
		hint: "Behind each item",
	},
	{
		key: "text",
		label: "Item text",
		hint: "Item names and descriptions on cards",
	},
	{
		key: "primary",
		label: "Buttons and prices",
		hint: "Buttons, prices and section accents",
	},
];

interface CustomThemeConfigurationProps {
	colors: CustomThemeColors;
	onColorsChange: (colors: CustomThemeColors) => void;
	/** The saved theme being edited; undefined while building a new one. */
	editingTheme?: SavedTheme;
	/** Saves over `editingTheme`, or as a new theme when there is none. */
	onSave: (
		name: string,
		colors: CustomThemeColors,
	) => Promise<{ success: boolean; error?: string }>;
}

const CustomThemeConfiguration = ({
	colors,
	onColorsChange,
	editingTheme,
	onSave,
}: CustomThemeConfigurationProps) => {
	const [name, setName] = useState(editingTheme?.name ?? "");
	const [isSaving, setIsSaving] = useState(false);
	const nameRef = useRef<HTMLInputElement>(null);
	const formId = useId();

	// The field shows the theme being edited and follows a switch to another
	// theme or a rename that just saved. A save never clears it.
	useEffect(() => {
		setName(editingTheme?.name ?? "");
	}, [editingTheme?.name]);

	const trimmedName = name.trim();
	// Editing a saved theme only offers Update once something differs from it.
	const hasChanges = editingTheme
		? trimmedName !== editingTheme.name ||
			!customThemeColorsEqual(colors, editingTheme.colors)
		: true;
	const cardBackground =
		colors.cardBackground ?? DEFAULT_CUSTOM_COLORS.cardBackground;
	const swatches = COLOR_FIELDS.map(
		({ key }) => colors[key] ?? DEFAULT_CUSTOM_COLORS[key],
	);

	const handleColorChange = (key: ColorKey, value: string) => {
		onColorsChange({ ...colors, [key]: value });
	};

	const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!trimmedName) {
			toast.error("Give your theme a name first");
			nameRef.current?.focus();
			return;
		}
		if (isSaving || !hasChanges) return;
		setIsSaving(true);
		const res = await onSave(trimmedName, colors);
		setIsSaving(false);
		if (res.success) {
			toast.success(editingTheme ? "Theme updated" : "Theme saved");
		} else {
			toast.error(res.error || "Failed to save theme");
		}
	};

	const startRename = () => {
		nameRef.current?.focus();
		nameRef.current?.select();
	};

	return (
		<div className="space-y-4">
			{editingTheme ? (
				<div className="flex items-center gap-2 rounded-xl bg-product-background-hero py-1 pl-3 pr-1 text-[13px] text-product-foreground-accent">
					<Palette aria-hidden="true" className="h-4 w-4 shrink-0" />
					<span className="min-w-0 flex-1 truncate">
						Editing{" "}
						<strong className="font-semibold text-product-foreground">
							{editingTheme.name}
						</strong>
					</span>
					<button
						aria-label={`Rename ${editingTheme.name}`}
						className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-product-card hover:text-product-foreground"
						onClick={startRename}
						type="button"
					>
						<Pencil aria-hidden="true" className="h-3.5 w-3.5" />
					</button>
				</div>
			) : (
				<p className="flex items-center gap-2 rounded-xl bg-product-background-hero px-3 py-2 text-[13px] text-product-foreground-accent">
					<Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
					<span>New custom theme. Name it and save it to reuse it later.</span>
				</p>
			)}

			{/* Only the name sits in the form, so Enter in a hex field never saves. */}
			<form className="space-y-2" id={formId} onSubmit={handleSave}>
				<Label htmlFor="custom-theme-name">Theme name</Label>
				<Input
					autoComplete="off"
					disabled={isSaving}
					id="custom-theme-name"
					maxLength={60}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Summer menu"
					ref={nameRef}
					value={name}
				/>
			</form>

			<ul className="divide-y divide-product-border border-y border-product-border">
				{COLOR_FIELDS.map(({ key, label, hint }) => {
					const value = colors[key] ?? DEFAULT_CUSTOM_COLORS[key];
					const inputId = `custom-color-${key}`;
					return (
						<li
							className="flex min-h-14 items-center justify-between gap-3 py-2"
							key={key}
						>
							<div className="min-w-0">
								<Label className="block truncate" htmlFor={inputId}>
									{label}
								</Label>
								<p className="mt-0.5 truncate text-xs text-product-muted">
									{hint}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<ColorPicker
									label={label}
									onChange={(next) => handleColorChange(key, next)}
									swatches={swatches}
									value={value}
								/>
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

			{!isTextReadableOnCard(colors) && (
				<p
					className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent"
					role="status"
				>
					<CircleAlert
						aria-hidden="true"
						className="mt-px h-4 w-4 shrink-0 text-product-warning"
					/>
					<span>
						Item text is hard to read on this card background, so cards show it
						a little {isDarkBackground(cardBackground) ? "lighter" : "darker"}.
					</span>
				</p>
			)}

			<div className="space-y-1.5">
				<Button
					className="w-full"
					disabled={isSaving || !hasChanges}
					form={formId}
					type="submit"
				>
					{isSaving
						? "Saving..."
						: editingTheme
							? "Update theme"
							: "Save theme"}
				</Button>
				{editingTheme && !hasChanges && (
					<p className="text-center text-xs text-product-muted">
						No changes to update yet.
					</p>
				)}
			</div>
		</div>
	);
};

export default CustomThemeConfiguration;
