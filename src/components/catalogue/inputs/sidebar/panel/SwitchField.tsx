import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/ui/cn";
import { InfoTip } from "./InfoTip";

interface SwitchFieldProps {
	id: string;
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	/** Short line under the label. */
	hint?: ReactNode;
	/** Text for an (i) popover after the label. */
	info?: ReactNode;
	disabled?: boolean;
	className?: string;
}

/**
 * A labelled on/off row. The label is tied to the switch, so the whole text
 * is a tap target, and the row is at least 44px tall.
 */
export const SwitchField = ({
	id,
	label,
	checked,
	onCheckedChange,
	hint,
	info,
	disabled,
	className,
}: SwitchFieldProps) => (
	<div
		className={cn(
			"flex min-h-11 items-center justify-between gap-3",
			className,
		)}
	>
		<div className="min-w-0 space-y-1">
			<div className="flex items-center gap-1">
				<Label className="cursor-pointer leading-snug" htmlFor={id}>
					{label}
				</Label>
				{info && <InfoTip label={label}>{info}</InfoTip>}
			</div>
			{hint && (
				<p className="text-[12.5px] leading-snug text-product-muted">{hint}</p>
			)}
		</div>
		<Switch
			checked={checked}
			disabled={disabled}
			id={id}
			onCheckedChange={onCheckedChange}
		/>
	</div>
);
