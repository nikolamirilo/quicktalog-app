"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { customThemeColorsEqual, DEFAULT_CUSTOM_COLORS } from "@/helpers/theme";
import type { CustomThemeColors, SavedTheme } from "@quicktalog/common";
import { themes } from "@quicktalog/common";
import { Info, Palette, Plus, X } from "lucide-react";
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
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-bold">Themes</h3>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent className="z-[2000] w-[200px] p-3 text-sm" side="top">
						<p>Select the overall visual theme for your catalogue.</p>
					</PopoverContent>
				</Popover>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
				<button
					className={`flex flex-col items-center justify-center gap-2 p-3 w-full h-24 rounded-lg border-2 border-dashed transition-all duration-300 ease-in-out hover:scale-[1.02] ${
						isCreatingCustom
							? "border-product-primary border-solid shadow-md scale-[1.03]"
							: "border-border hover:border-product-primary/50 hover:shadow-sm"
					}`}
					onClick={onCustomSelect}
					type="button"
				>
					<div
						className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
						style={{ background: CUSTOM_TILE_GRADIENT }}
					>
						<Plus className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
					</div>
					<span className="text-xs font-medium">Custom</span>
				</button>

				{visibleSavedThemes.map((saved) => {
					const isSelected = saved.id === activeSavedThemeId;
					const background =
						saved.colors.background ?? DEFAULT_CUSTOM_COLORS.background;
					const heading = saved.colors.heading ?? DEFAULT_CUSTOM_COLORS.heading;
					const primary = saved.colors.primary ?? DEFAULT_CUSTOM_COLORS.primary;
					return (
						<div
							className={`group relative flex flex-col items-center justify-center p-3 w-full h-24 rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] ${
								isSelected
									? "shadow-md scale-[1.03] border-[3px]"
									: "hover:shadow-sm border"
							}`}
							key={saved.id}
							onClick={() => onSavedThemeSelect(saved.colors)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onSavedThemeSelect(saved.colors);
								}
							}}
							role="button"
							style={{
								borderColor: isSelected ? "var(--product-primary)" : "#e5e7eb",
								backgroundColor: background,
								color: heading,
							}}
							tabIndex={0}
						>
							<span
								className="absolute top-1 left-1 flex items-center justify-center w-5 h-5 rounded-full bg-black/70 text-white"
								title="Custom theme"
							>
								<Palette className="w-3 h-3" />
							</span>
							<button
								aria-label={`Delete ${saved.name}`}
								className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/70 text-white hover:bg-destructive transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									onDeleteSavedTheme(saved.id);
								}}
								type="button"
							>
								<X className="w-3 h-3" />
							</button>
							<div
								className="w-8 h-8 mb-2 rounded-full border-2"
								style={{ backgroundColor: primary, borderColor: heading }}
							/>
							<span className="text-xs font-medium truncate max-w-full px-1">
								{saved.name}
							</span>
						</div>
					);
				})}

				{visibleThemes.map((themeItem) => {
					const isSelected =
						!isCustomActive && currentThemeName === themeItem.key;
					return (
						<button
							className={`flex flex-col items-center justify-center p-3 w-full h-24 rounded-lg transition-all duration-300 ease-in-out hover:scale-[1.02] ${
								themeItem.key
							} ${
								isSelected
									? "border-product-primary shadow-md scale-[1.03] border-[3px]"
									: "hover:shadow-sm border border-border"
							}`}
							key={themeItem.key}
							onClick={() => onThemeSelect(themeItem.key)}
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

			{visibleCount < totalThemeCount && (
				<Button
					className="w-full"
					onClick={() => setVisibleCount((prev) => prev + 6)}
					variant="outline"
				>
					Show more
				</Button>
			)}
			{visibleCount > totalThemeCount && (
				<Button
					className="w-full"
					onClick={() => setVisibleCount(5)}
					variant="outline"
				>
					Show less
				</Button>
			)}
		</div>
	);
};

export default ThemeSelection;
