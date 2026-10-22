import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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
}: SliderFieldProps) => {
	const labelId = useId();
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-3">
				<Label id={labelId}>{label}</Label>
				<span className="text-[13px] font-semibold tabular-nums text-product-foreground-accent capitalize">
					{valueText}
				</span>
			</div>
			<Slider
				aria-labelledby={labelId}
				className="h-11"
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
