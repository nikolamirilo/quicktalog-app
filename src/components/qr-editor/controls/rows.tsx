"use client";

import { type ReactNode, useId } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/ui/cn";

/** A bordered list of setting rows. */
export function Rows({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"mt-3.5 overflow-hidden rounded-2xl border border-product-border [&>*+*]:border-t [&>*+*]:border-product-border",
				className,
			)}
		>
			{children}
		</div>
	);
}

function RowText({
	id,
	title,
	hint,
	htmlFor,
}: {
	id?: string;
	title: string;
	hint?: string;
	htmlFor?: string;
}) {
	const Text = htmlFor ? "label" : "span";
	return (
		<Text
			className={cn(
				"flex min-w-0 flex-1 flex-col gap-[3px]",
				htmlFor && "cursor-pointer",
			)}
			htmlFor={htmlFor}
			id={id}
		>
			<b className="text-sm font-semibold leading-tight text-product-foreground">
				{title}
			</b>
			{hint && (
				<small className="text-[12.5px] leading-snug text-product-muted">
					{hint}
				</small>
			)}
		</Text>
	);
}

export function ToggleRow({
	title,
	hint,
	checked,
	onCheckedChange,
	disabled,
}: {
	title: string;
	hint?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	const id = useId();
	return (
		<div className="flex items-center gap-3.5 bg-product-card p-3.5">
			<RowText hint={hint} htmlFor={id} title={title} />
			<Switch
				checked={checked}
				disabled={disabled}
				id={id}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
}

export function SliderRow({
	title,
	hint,
	value,
	min,
	max,
	step,
	format,
	onChange,
	disabled,
}: {
	title: string;
	hint?: string;
	value: number;
	min: number;
	max: number;
	step: number;
	format: (value: number) => string;
	onChange: (value: number) => void;
	disabled?: boolean;
}) {
	const labelId = useId();
	return (
		<div className="flex flex-wrap items-center gap-x-3.5 gap-y-3 bg-product-card p-3.5">
			<RowText hint={hint} id={labelId} title={title} />
			<output
				aria-hidden="true"
				className="min-w-[52px] shrink-0 rounded-[9px] bg-product-primary-soft px-[9px] py-1.5 text-center font-mono text-[13px] font-semibold leading-none text-product-primary-ink"
			>
				{format(value)}
			</output>
			<Slider
				aria-labelledby={labelId}
				className="basis-full py-2"
				disabled={disabled}
				max={max}
				min={min}
				onValueChange={([v]) => onChange(v)}
				step={step}
				value={[value]}
			/>
		</div>
	);
}
