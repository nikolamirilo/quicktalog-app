"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Palette } from "lucide-react";
import React, { useMemo } from "react";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (val: string) => void;
}

const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => (
	<div className="flex items-center justify-between gap-3 py-1">
		<Label className="text-sm font-medium">{label}</Label>
		<div className="flex items-center gap-2">
			<div className="h-8 w-8 rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
				<input
					className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
					onChange={(e) => onChange(e.target.value)}
					type="color"
					value={value}
				/>
			</div>
			<Input
				className="w-24 h-8 font-mono text-xs"
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
		</div>
	</div>
);

const getColorDistance = (color1: string, color2: string): number => {
	const hexToRgb = (hex: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
				}
			: { r: 0, g: 0, b: 0 };
	};

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	return Math.sqrt(
		Math.pow(rgb1.r - rgb2.r, 2) +
			Math.pow(rgb1.g - rgb2.g, 2) +
			Math.pow(rgb1.b - rgb2.b, 2),
	);
};

export interface ColorControlsProps {
	dotsColor: string;
	backgroundColor: string;
	cornerFrameColor: string;
	cornerDotColor: string;
	onDotsColorChange: (color: string) => void;
	onBackgroundColorChange: (color: string) => void;
	onCornerFrameColorChange: (color: string) => void;
	onCornerDotColorChange: (color: string) => void;
}

export default function ColorControls({
	dotsColor,
	backgroundColor,
	cornerFrameColor,
	cornerDotColor,
	onDotsColorChange,
	onBackgroundColorChange,
	onCornerFrameColorChange,
	onCornerDotColorChange,
}: ColorControlsProps) {
	const hasLowContrast = useMemo(() => {
		const dotDistance = getColorDistance(backgroundColor, dotsColor);
		const cornerFrameDistance = getColorDistance(
			backgroundColor,
			cornerFrameColor,
		);
		const cornerDotDistance = getColorDistance(backgroundColor, cornerDotColor);

		return (
			dotDistance < 50 || cornerFrameDistance < 50 || cornerDotDistance < 50
		);
	}, [backgroundColor, dotsColor, cornerFrameColor, cornerDotColor]);

	return (
		<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
			<CardHeader className="pb-4">
				<CardTitle className="text-base font-semibold flex items-center gap-2">
					<Palette className="w-4 h-4 text-[var(--product-primary)]" />
					Color Palette
				</CardTitle>
				<p className="text-xs text-muted-foreground mt-1">
					Customize your QR code colors
				</p>
			</CardHeader>
			<CardContent className="space-y-4 pt-5">
				<ColorPicker
					label="QR Dots"
					onChange={onDotsColorChange}
					value={dotsColor}
				/>
				<ColorPicker
					label="Background"
					onChange={onBackgroundColorChange}
					value={backgroundColor}
				/>

				<div className="h-px bg-gray-200 my-4" />

				<ColorPicker
					label="Corner Frames"
					onChange={onCornerFrameColorChange}
					value={cornerFrameColor}
				/>
				<ColorPicker
					label="Corner Dots"
					onChange={onCornerDotColorChange}
					value={cornerDotColor}
				/>

				{hasLowContrast && (
					<div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
						<AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
						<div>
							<p className="text-sm font-medium text-black">
								Low Contrast Warning
							</p>
							<p className="text-xs text-black mt-1">
								Your QR code may be hard to scan. Try increasing the contrast
								between colors.
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
