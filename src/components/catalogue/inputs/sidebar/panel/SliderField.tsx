import { type ReactNode, useId } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTip } from "./InfoTip";
import { NewBadge } from "./NewBadge";

interface SliderFieldProps {
	label: string;
	/** The current value as shown to the user, e.g. "120px" or "Medium". */
	valueText: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onValueChange: (value: number) => void;
	/** Labels under the two ends (or evenly across) of the track. */
	marks?: string[];
	/** Text for an (i) popover after the label. */
	info?: ReactNode;
	isNew?: boolean;
	disabled?: boolean;
}

/** Label, current value and a slider whose hit area is 44px tall. */
export const SliderField = ({
	label,
	valueText,
	value,
	min,
	max,
	step,
	onValueChange,
	marks,
	info,
	isNew,
	disabled,
}: SliderFieldProps) => {
	const labelId = useId();
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-3">
				<div className="flex items-center gap-1">
					<Label id={labelId}>{label}</Label>
					{isNew && <NewBadge />}
					{info && <InfoTip label={label}>{info}</InfoTip>}
				</div>
				<span className="text-[13px] font-semibold tabular-nums text-product-foreground-accent capitalize">
					{valueText}
				</span>
			</div>
			<Slider
				aria-labelledby={labelId}
				className="h-11"
				disabled={disabled}
				max={max}
				min={min}
				onValueChange={(vals) => onValueChange(vals[0])}
				step={step}
				value={[value]}
			/>
			{marks && (
				<div
					aria-hidden="true"
					className="-mt-2 flex justify-between text-xs text-product-muted"
				>
					{marks.map((mark) => (
						<span key={mark}>{mark}</span>
					))}
				</div>
			)}
		</div>
	);
};
