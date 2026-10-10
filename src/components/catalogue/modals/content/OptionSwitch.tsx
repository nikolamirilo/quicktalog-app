"use client";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/ui/cn";

interface OptionSwitchProps {
	id: string;
	icon: ReactNode;
	label: string;
	hint: ReactNode;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}

/**
 * An on/off option in a builder dialog: icon tile, title, one-line hint and a
 * switch. The label is tied to the switch, so the text is a tap target too.
 * Disabled options stay visible, dashed and muted, with the hint saying why.
 */
export function OptionSwitch({
	id,
	icon,
	label,
	hint,
	checked,
	onCheckedChange,
	disabled,
}: OptionSwitchProps) {
	return (
		<div
			className={cn(
				"flex min-h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-product-border bg-product-card px-3 py-2.5 transition-colors",
				disabled && "border-dashed bg-product-background",
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"grid size-8 flex-none place-items-center rounded-[10px] border border-product-primary/40 bg-product-primary-soft text-product-primary-ink [&_svg]:size-4",
					disabled &&
						"border-product-border bg-product-background-hero text-product-muted",
				)}
			>
				{icon}
			</span>
			<div className="min-w-0 flex-1">
				<Label
					className={cn(
						"block cursor-pointer text-sm leading-[18px]",
						disabled && "cursor-not-allowed text-product-muted",
					)}
					htmlFor={id}
				>
					{label}
				</Label>
				<p
					className="mt-0.5 text-[12.5px] leading-4 text-product-muted"
					id={`${id}-hint`}
				>
					{hint}
				</p>
			</div>
			<Switch
				aria-describedby={`${id}-hint`}
				checked={checked}
				disabled={disabled}
				id={id}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
}
