"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { themes } from "@quicktalog/common";
import { Info } from "lucide-react";
import { useState } from "react";

export interface ThemeSelectionProps {
	currentThemeName: string | undefined;
	onThemeSelect: (themeKey: string) => void;
}

const ThemeSelection = ({
	currentThemeName,
	onThemeSelect,
}: ThemeSelectionProps) => {
	const [visibleCount, setVisibleCount] = useState(3);

	const sortedThemes = [...themes].sort((a, b) => a.id - b.id);
	const visibleThemes = sortedThemes.slice(0, visibleCount);

	return (
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
	);
};

export default ThemeSelection;
