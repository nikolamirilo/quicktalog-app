import { Check } from "lucide-react";

/** Amber check circle used in plan feature lists. */
export const PlanCheck = () => (
	<span
		aria-hidden="true"
		className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-product-primary text-product-foreground"
	>
		<Check className="h-[11px] w-[11px]" strokeWidth={3.2} />
	</span>
);
