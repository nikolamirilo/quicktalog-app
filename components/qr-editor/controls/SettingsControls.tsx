"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, Settings } from "lucide-react";
import React from "react";

export interface SettingsControlsProps {
	errorCorrectionLevel: string;
	margin: number;
	onErrorCorrectionChange: (val: string) => void;
	onMarginChange: (val: number) => void;
}

export default function SettingsControls({
	errorCorrectionLevel,
	margin,
	onErrorCorrectionChange,
	onMarginChange,
}: SettingsControlsProps) {
	return (
		<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
			<CardHeader className="pb-4">
				<CardTitle className="text-base font-semibold flex items-center gap-2">
					<Settings className="w-4 h-4 text-[var(--product-primary)]" />
					Advanced Settings
				</CardTitle>
				<p className="text-xs text-muted-foreground mt-1">
					Fine-tune your QR code's technical properties
				</p>
			</CardHeader>
			<CardContent className="space-y-5 pt-5">
				<div className="space-y-3">
					<Label className="text-sm font-medium">Error Correction Level</Label>
					<Select
						onValueChange={onErrorCorrectionChange}
						value={errorCorrectionLevel}
					>
						<SelectTrigger className="h-10 font-medium">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="L">Low (7%)</SelectItem>
							<SelectItem value="M">Medium (15%)</SelectItem>
							<SelectItem value="Q">Quartile (25%)</SelectItem>
							<SelectItem value="H">High (30%)</SelectItem>
						</SelectContent>
					</Select>
					<div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
						<Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
						<p className="text-xs text-blue-700">
							Higher correction levels allow the QR code to be scanned even if
							partially damaged or obscured
						</p>
					</div>
				</div>

				<div className="space-y-3 p-4 bg-gray-50 rounded-xl">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium">Margin (Padding)</Label>
						<span className="text-base font-bold text-[var(--product-primary)] bg-white px-3 py-1 rounded-md">
							{margin}px
						</span>
					</div>
					<Slider
						className="cursor-pointer"
						max={50}
						min={0}
						onValueChange={([val]) => onMarginChange(val)}
						step={1}
						value={[margin]}
					/>
					<p className="text-xs text-muted-foreground">
						Add space around the QR code for better scanning
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
