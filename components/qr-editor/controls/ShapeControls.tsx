"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Circle,
	CircleDot,
	RectangleEllipsis,
	Sparkles,
	Square,
	SquareDot,
} from "lucide-react";
import React from "react";

export interface ShapeControlsProps {
	dotsType: string;
	cornersSquareType: string;
	cornersDotType: string;
	onDotsTypeChange: (type: string) => void;
	onCornersSquareTypeChange: (type: string) => void;
	onCornersDotTypeChange: (type: string) => void;
}

const dotStyles = [
	{ type: "square", icon: Square, label: "Square" },
	{ type: "dots", icon: Circle, label: "Dots" },
	{ type: "rounded", icon: RectangleEllipsis, label: "Rounded" },
	{ type: "extra-rounded", icon: CircleDot, label: "Extra" },
	{ type: "classy", icon: Sparkles, label: "Classy" },
	{ type: "classy-rounded", icon: Sparkles, label: "Classy+" },
];

const cornerFrameStyles = [
	{ type: "square", icon: Square, label: "Square" },
	{ type: "dot", icon: Circle, label: "Dot" },
	{ type: "extra-rounded", icon: RectangleEllipsis, label: "Rounded" },
];

const cornerDotStyles = [
	{ type: "square", icon: SquareDot, label: "Square" },
	{ type: "dot", icon: CircleDot, label: "Dot" },
];

function StyleButtonGrid({
	items,
	activeType,
	onSelect,
	columns,
}: {
	items: { type: string; icon: React.ElementType; label: string }[];
	activeType: string;
	onSelect: (type: string) => void;
	columns: number;
}) {
	return (
		<div className={`grid grid-cols-${columns} gap-3`}>
			{items.map(({ type, icon: Icon, label }) => (
				<Button
					className={`h-11 gap-2 font-medium transition-all ${
						activeType === type
							? "bg-[var(--product-primary)] hover:bg-[var(--product-primary-accent)] text-white shadow-md"
							: "bg-gray-100 hover:bg-gray-200 hover:border-[var(--product-primary)]/50"
					}`}
					key={type}
					onClick={() => onSelect(type)}
					size="sm"
					variant={activeType === type ? "default" : "outline"}
				>
					<Icon className="w-4 h-4" />
					<span className="text-sm">{label}</span>
				</Button>
			))}
		</div>
	);
}

export default function ShapeControls({
	dotsType,
	cornersSquareType,
	cornersDotType,
	onDotsTypeChange,
	onCornersSquareTypeChange,
	onCornersDotTypeChange,
}: ShapeControlsProps) {
	return (
		<>
			<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
				<CardHeader className="pb-4">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Circle className="w-4 h-4 text-[var(--product-primary)]" />
						Dots Pattern
					</CardTitle>
					<p className="text-xs text-muted-foreground mt-1">
						Choose the style for your QR code dots
					</p>
				</CardHeader>
				<CardContent className="pt-5">
					<StyleButtonGrid
						activeType={dotsType}
						columns={2}
						items={dotStyles}
						onSelect={onDotsTypeChange}
					/>
				</CardContent>
			</Card>

			<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
				<CardHeader className="pb-4">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<Square className="w-4 h-4 text-[var(--product-primary)]" />
						Corner Frames
					</CardTitle>
					<p className="text-xs text-muted-foreground mt-1">
						Style the frame around corner markers
					</p>
				</CardHeader>
				<CardContent className="pt-5">
					<StyleButtonGrid
						activeType={cornersSquareType}
						columns={3}
						items={cornerFrameStyles}
						onSelect={onCornersSquareTypeChange}
					/>
				</CardContent>
			</Card>

			<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
				<CardHeader className="pb-4">
					<CardTitle className="text-base font-semibold flex items-center gap-2">
						<CircleDot className="w-4 h-4 text-[var(--product-primary)]" />
						Corner Dots
					</CardTitle>
					<p className="text-xs text-muted-foreground mt-1">
						Style the dot inside corner markers
					</p>
				</CardHeader>
				<CardContent className="pt-5">
					<StyleButtonGrid
						activeType={cornersDotType}
						columns={2}
						items={cornerDotStyles}
						onSelect={onCornersDotTypeChange}
					/>
				</CardContent>
			</Card>
		</>
	);
}
