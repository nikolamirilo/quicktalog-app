"use client";

import { Button } from "@/components/ui/button";
import {
	customThemeColorsEqual,
	DEFAULT_CUSTOM_COLORS,
} from "@/lib/themes/custom-theme";
import { cn } from "@/lib/ui/cn";
import type { CustomThemeColors, SavedTheme } from "@quicktalog/common";
import { themes } from "@quicktalog/common";
import { Palette, Plus, X } from "lucide-react";
import { useState } from "react";

interface ThemeSelectionProps {
	currentThemeName: string | undefined;
	onThemeSelect: (themeKey: string) => void;
	isCustomActive: boolean;
	currentCustomColors: CustomThemeColors | undefined;
	onCustomSelect: () => void;
	savedThemes: SavedTheme[];
	onSavedThemeSelect: (colors: CustomThemeColors) => void;
	onDeleteSavedTheme: (id: string) => void;
}

const CUSTOM_TILE_GRADIENT =
	"conic-gradient(from 180deg, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #f97316)";

/** Selection is shown outside the tile, so the tile keeps the theme's own look. */
const SELECTED_RING =
	"ring-[2.5px] ring-product-primary-accent ring-offset-2 ring-offset-product-card";

const ThemeSelection = ({
	currentThemeName,
	onThemeSelect,
	isCustomActive,
	currentCustomColors,
	onCustomSelect,
	savedThemes,
	onSavedThemeSelect,
	onDeleteSavedTheme,
}: ThemeSelectionProps) => {
	const [visibleCount, setVisibleCount] = useState(5);

	const sortedThemes = [...themes].sort((a, b) => a.id - b.id);
	// Saved custom themes are listed first, so the 5-tile default is shared
	// between them and the standard themes instead of always showing 5 of each.
	const visibleSavedThemes = savedThemes.slice(0, visibleCount);
	const visibleThemes = sortedThemes.slice(
		0,
		Math.max(0, visibleCount - visibleSavedThemes.length),
	);
	const totalThemeCount = savedThemes.length + sortedThemes.length;

	const activeSavedThemeId = isCustomActive
		? savedThemes.find((saved) =>
				customThemeColorsEqual(saved.colors, currentCustomColors),
			)?.id
		: undefined;
	const isCreatingCustom = isCustomActive && !activeSavedThemeId;

	return (
		<div className="space-y-3">
			<ul
				aria-label="Themes"
				className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5"
			>
				<li>
					<button
						aria-pressed={isCreatingCustom}
						className={cn(
							"flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-product-border-strong bg-product-card p-3 text-product-foreground-accent transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-product-primary-accent",
							isCreatingCustom && SELECTED_RING,
							isCreatingCustom && "border-solid",
						)}
						onClick={onCustomSelect}
						type="button"
					>
						<span
							aria-hidden="true"
							className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm"
							style={{ background: CUSTOM_TILE_GRADIENT }}
						>
							<Plus
								className="h-4 w-4 text-white drop-shadow"
								strokeWidth={3}
							/>
						</span>
						<span className="text-xs font-semibold">Custom</span>
					</button>
				</li>

				{visibleSavedThemes.map((saved) => {
					const isSelected = saved.id === activeSavedThemeId;
					const background =
						saved.colors.background ?? DEFAULT_CUSTOM_COLORS.background;
					const heading = saved.colors.heading ?? DEFAULT_CUSTOM_COLORS.heading;
					const primary = saved.colors.primary ?? DEFAULT_CUSTOM_COLORS.primary;
					return (
						<li className="group relative" key={saved.id}>
							{/* The tile previews the saved colours, so they are inline. */}
							<button
								aria-label={`${saved.name} (saved custom theme)`}
								aria-pressed={isSelected}
								className={cn(
									"flex h-24 w-full flex-col items-center justify-center rounded-2xl border border-product-border p-3 transition-[box-shadow,transform] hover:-translate-y-px",
									isSelected && SELECTED_RING,
								)}
								onClick={() => onSavedThemeSelect(saved.colors)}
								style={{ backgroundColor: background, color: heading }}
								type="button"
							>
								<span
									aria-hidden="true"
									className="mb-2 h-8 w-8 rounded-full border-2"
									style={{ backgroundColor: primary, borderColor: heading }}
								/>
								<span className="max-w-full truncate px-1 text-xs font-medium">
									{saved.name}
								</span>
							</button>
							<span
								aria-hidden="true"
								className="pointer-events-none absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-product-dark/75 text-white"
							>
								<Palette className="h-3 w-3" />
							</span>
							<button
								aria-label={`Delete ${saved.name}`}
								className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-product-dark/75 text-white transition-[opacity,background-color] before:absolute before:-inset-1.5 before:content-[''] hover:bg-product-error focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
								onClick={() => onDeleteSavedTheme(saved.id)}
								type="button"
							>
								<X aria-hidden="true" className="h-3.5 w-3.5" />
							</button>
						</li>
					);
				})}

				{visibleThemes.map((themeItem) => {
					const isSelected =
						!isCustomActive && currentThemeName === themeItem.key;
					return (
						<li key={themeItem.key}>
							{/* The theme class scopes the catalogue variables, so the tile
							    previews the theme in its own colours and fonts. */}
							<button
								aria-pressed={isSelected}
								className={cn(
									"flex h-24 w-full flex-col items-center justify-center rounded-2xl border p-3 transition-[box-shadow,transform] hover:-translate-y-px",
									themeItem.key,
									isSelected && SELECTED_RING,
								)}
								onClick={() => onThemeSelect(themeItem.key)}
								style={{
									borderColor: "var(--catalogue-section-border)",
									backgroundColor: "var(--catalogue-background)",
									color: "var(--catalogue-foreground)",
									fontFamily: "var(--catalogue-font-body)",
								}}
								type="button"
							>
								<span
									aria-hidden="true"
									className="mb-2 h-8 w-8 rounded-full border-2"
									style={{
										backgroundColor: "var(--catalogue-primary)",
										borderColor: "var(--catalogue-foreground)",
									}}
								/>
								<span
									className="max-w-full truncate text-xs font-medium"
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
						</li>
					);
				})}
			</ul>

			{visibleCount < totalThemeCount && (
				<Button
					className="w-full"
					onClick={() => setVisibleCount((prev) => prev + 6)}
					size="sm"
					type="button"
					variant="outline"
				>
					Show more themes
				</Button>
			)}
			{visibleCount > totalThemeCount && (
				<Button
					className="w-full"
					onClick={() => setVisibleCount(5)}
					size="sm"
					type="button"
					variant="outline"
				>
					Show fewer themes
				</Button>
			)}
		</div>
	);
};

export default ThemeSelection;
