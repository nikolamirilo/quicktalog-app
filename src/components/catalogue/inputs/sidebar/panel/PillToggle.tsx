import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";

/** A checkbox drawn as a pill; the whole pill is the tap target. */
export const pillToggleClass =
	"inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-product-border bg-product-card pl-2.5 pr-3.5 text-[13.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-border-strong has-[[data-state=checked]]:border-product-primary-accent has-[[data-state=checked]]:bg-product-primary-soft has-[[data-state=checked]]:text-product-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

export const PillToggle = ({
	id,
	checked,
	onCheckedChange,
	disabled,
	children,
}: {
	id: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	children: ReactNode;
}) => (
	<label className={pillToggleClass} htmlFor={id}>
		<Checkbox
			checked={checked}
			className="h-4 w-4 rounded-[5px]"
			disabled={disabled}
			id={id}
			onCheckedChange={(value) => onCheckedChange(value === true)}
		/>
		{children}
	</label>
);
