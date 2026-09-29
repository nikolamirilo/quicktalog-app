"use client";

import type { ErrorCorrectionLevel } from "qr-code-styling";
import { useId } from "react";
import { PanelHeading } from "@/components/qr-editor/controls/PanelHeading";
import {
	Rows,
	SliderRow,
	ToggleRow,
} from "@/components/qr-editor/controls/rows";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { ERROR_CORRECTION, FRAME_TEXT_MAX } from "@/lib/qr/design";
import { cn } from "@/lib/ui/cn";

export function SettingsControls({
	errorCorrectionLevel,
	margin,
	frameText,
	onErrorCorrectionChange,
	onMarginChange,
	onFrameTextChange,
}: {
	errorCorrectionLevel: ErrorCorrectionLevel;
	margin: number;
	frameText: { show: boolean; text: string };
	onErrorCorrectionChange: (level: ErrorCorrectionLevel) => void;
	onMarginChange: (margin: number) => void;
	onFrameTextChange: (frameText: { show: boolean; text: string }) => void;
}) {
	const labelId = useId();
	const textId = useId();
	const { onKeyDown, itemProps } = useRadioKeys(
		ERROR_CORRECTION.map((l) => l.value),
		errorCorrectionLevel,
		onErrorCorrectionChange,
	);

	return (
		<>
			<PanelHeading
				description="Fine-tune your QR code's technical properties."
				title="Advanced settings"
			/>
			<p
				className="mb-2 text-[13.5px] font-semibold leading-tight text-product-foreground-accent"
				id={labelId}
			>
				Error correction level
			</p>
			<div
				aria-labelledby={labelId}
				className="grid grid-cols-4 gap-1 rounded-[15px] border border-product-border bg-product-background-hero p-1"
				onKeyDown={onKeyDown}
				role="radiogroup"
			>
				{ERROR_CORRECTION.map((level, i) => {
					const checked = level.value === errorCorrectionLevel;
					return (
						<button
							{...itemProps(level.value, i)}
							className={cn(
								"flex min-w-0 flex-col items-center gap-1 rounded-[11px] px-1 py-[9px] text-product-foreground-accent transition-[background-color,color,box-shadow] hover:text-product-foreground",
								checked &&
									"bg-product-card text-product-foreground shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.08),0_4px_10px_-2px_rgb(var(--product-foreground-rgb)/0.08),inset_0_-3px_0_var(--product-primary)]",
							)}
							key={level.value}
						>
							<b className="font-product-heading text-base font-extrabold leading-none">
								{level.value}
							</b>
							<small className="max-w-full truncate text-[10.5px] font-medium leading-tight text-product-muted sm:text-[11.5px]">
								{level.name} · {level.percent}%
							</small>
						</button>
					);
				})}
			</div>
			<p className="mt-2 text-[12.5px] leading-snug text-product-muted">
				Higher correction levels allow the QR code to be scanned even if
				partially damaged or obscured.
			</p>

			<Rows>
				<SliderRow
					format={(v) => `${v}px`}
					hint="Add space around the QR code for better scanning."
					max={50}
					min={0}
					onChange={onMarginChange}
					step={1}
					title="Margin (padding)"
					value={margin}
				/>
			</Rows>

			<PanelHeading
				badge={
					<span className="inline-flex h-5 items-center rounded-full border border-product-secondary/[0.18] bg-product-secondary-soft px-2 text-[11px] font-bold tracking-[0.04em] text-product-secondary">
						New
					</span>
				}
				className="mt-6"
				description="A short label printed under the code, so people know what they are scanning."
				title="Frame text"
			/>
			<Rows>
				<ToggleRow
					checked={frameText.show}
					onCheckedChange={(show) => onFrameTextChange({ ...frameText, show })}
					title="Show frame text"
				/>
				<div className="flex flex-wrap items-center gap-3.5 bg-product-card p-3.5">
					<label
						className="shrink-0 text-sm font-semibold text-product-foreground"
						htmlFor={textId}
					>
						Text
					</label>
					<input
						className="h-10 min-w-0 flex-[1_1_200px] rounded-xl border border-product-border-strong bg-product-background px-3 text-sm font-medium text-product-foreground focus:border-product-primary-accent focus:bg-product-card focus:shadow-[0_0_0_4px_rgb(var(--product-primary-rgb)/0.2)] focus:outline-none disabled:opacity-60"
						disabled={!frameText.show}
						id={textId}
						maxLength={FRAME_TEXT_MAX}
						onChange={(e) =>
							onFrameTextChange({ ...frameText, text: e.target.value })
						}
						type="text"
						value={frameText.text}
					/>
				</div>
			</Rows>
		</>
	);
}
