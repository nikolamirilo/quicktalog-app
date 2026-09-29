"use client";

import type { ReactNode } from "react";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { cn } from "@/lib/ui/cn";

/** Option tiles with a glyph: the Style tab's pickers. */
export function RadioTiles<T extends string>({
	label,
	options,
	value,
	onChange,
	glyph,
	wide,
}: {
	label: string;
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	glyph: (value: T) => ReactNode;
	/** Six options: 3 columns, 6 from `sm`. Otherwise 3 fixed-width columns. */
	wide?: boolean;
}) {
	const { onKeyDown, itemProps } = useRadioKeys(
		options.map((o) => o.value),
		value,
		onChange,
	);
	return (
		<div
			aria-label={label}
			className={cn(
				"grid gap-2",
				wide
					? "grid-cols-3 sm:grid-cols-6"
					: "grid-cols-3 sm:grid-cols-[repeat(3,minmax(0,120px))]",
			)}
			onKeyDown={onKeyDown}
			role="radiogroup"
		>
			{options.map((option, i) => {
				const checked = option.value === value;
				return (
					<button
						{...itemProps(option.value, i)}
						className={cn(
							"relative flex min-w-0 flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-product-border bg-product-card px-1.5 pb-[11px] pt-2.5 text-[12.5px] font-semibold leading-none text-product-foreground-accent transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-product-border-strong",
							checked &&
								"border-product-primary-accent text-product-foreground shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)] hover:border-product-primary-accent",
						)}
						key={option.value}
					>
						<span
							aria-hidden="true"
							className={cn(
								"grid h-[52px] w-[52px] place-items-center rounded-xl bg-product-background-hero transition-colors [&_svg]:h-[34px] [&_svg]:w-[34px] [&_svg]:fill-product-foreground",
								checked && "bg-product-primary-soft",
							)}
						>
							{glyph(option.value)}
						</span>
						{option.label}
						{checked && (
							<span
								aria-hidden="true"
								className="absolute -right-[7px] -top-[7px] grid h-5 w-5 place-items-center rounded-full bg-product-primary shadow-[0_0_0_2px_var(--product-card)]"
							>
								<svg
									className="h-3 w-3"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3.4}
									viewBox="0 0 24 24"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
