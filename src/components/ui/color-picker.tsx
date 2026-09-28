"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (val: string) => void;
}

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => (
	<div className="flex items-center justify-between gap-3 py-1.5">
		<Label className="text-sm font-medium">{label}</Label>
		<div className="flex items-center gap-2">
			<div className="h-7 w-7 rounded-md overflow-hidden relative shadow-sm hover:shadow-md transition-shadow shrink-0">
				<input
					className="absolute -top-2 -left-2 w-11 h-11 p-0 border-0 cursor-pointer"
					onChange={(e) => onChange(e.target.value)}
					type="color"
					value={value}
				/>
			</div>
			<Input
				className="w-24 h-7 px-2 font-mono text-xs"
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
		</div>
	</div>
);
