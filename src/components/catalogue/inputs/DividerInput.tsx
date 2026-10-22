"use client";

import { SliderField } from "@/components/catalogue/inputs/sidebar/panel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DividerBlock } from "@quicktalog/common";

interface DividerInputProps {
	value: Partial<DividerBlock>;
	onChange: (value: Partial<DividerBlock>) => void;
}

const DividerInput = ({ value, onChange }: DividerInputProps) => {
	const spacing = value.spacing ?? 2;
	const border = value.border ?? {
		isEnabled: true,
		style: "solid",
		thickness: 1,
		color: "#000000",
		opacity: 100,
	};

	const handleBorderChange = (updates: Partial<typeof border>) => {
		onChange({
			border: {
				...border,
				...updates,
			},
		});
	};

	const opacity = border.opacity ?? 100;
	const thickness = border.thickness || 1;

	return (
		<div className="space-y-4 font-product-body">
			<SliderField
				label="Vertical spacing"
				max={10}
				min={0}
				onValueChange={(val) => onChange({ spacing: val })}
				step={0.5}
				value={spacing}
				valueText={`${spacing}rem`}
			/>

			<div className="space-y-4 border-t border-product-border pt-4">
				<div className="flex min-h-11 items-center gap-3">
					<Checkbox
						checked={border.isEnabled}
						id="enable-border"
						onCheckedChange={(checked) =>
							handleBorderChange({ isEnabled: checked as boolean })
						}
					/>
					<Label className="cursor-pointer" htmlFor="enable-border">
						Show a border line
					</Label>
				</div>

				{border.isEnabled && (
					<div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="divider-style">Style</Label>
							<Select
								onValueChange={(val: any) => handleBorderChange({ style: val })}
								value={border.style}
							>
								<SelectTrigger id="divider-style">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="solid">Solid</SelectItem>
									<SelectItem value="dashed">Dashed</SelectItem>
									<SelectItem value="dotted">Dotted</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<SliderField
							label="Thickness"
							max={10}
							min={1}
							onValueChange={(val) => handleBorderChange({ thickness: val })}
							step={1}
							value={thickness}
							valueText={`${thickness}px`}
						/>

						<div className="space-y-2">
							<Label htmlFor="divider-color">Colour</Label>
							<div className="flex items-center gap-2">
								<span
									className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-product-border-strong shadow-sm"
									style={{ backgroundColor: border.color }}
								>
									<input
										aria-label="Border colour picker"
										className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
										onChange={(e) =>
											handleBorderChange({ color: e.target.value })
										}
										type="color"
										value={border.color}
									/>
								</span>
								<Input
									autoComplete="off"
									className="h-11 w-[104px] px-3 font-mono text-sm uppercase md:text-sm"
									id="divider-color"
									maxLength={7}
									onChange={(e) =>
										handleBorderChange({ color: e.target.value })
									}
									spellCheck={false}
									value={border.color}
								/>
							</div>
						</div>

						<SliderField
							label="Opacity"
							max={100}
							min={0}
							onValueChange={(val) => handleBorderChange({ opacity: val })}
							step={10}
							value={opacity}
							valueText={`${opacity}%`}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default DividerInput;
