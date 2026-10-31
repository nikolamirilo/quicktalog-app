import { ArrowRight } from "lucide-react";

/** A link out of one panel section into the setting that unblocks it. */
export const PanelShortcut = ({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) => (
	<button
		className="inline-flex items-center gap-1.5 border-b-[1.5px] border-product-primary/70 pb-px text-[13px] font-semibold text-product-primary-ink hover:text-product-foreground"
		onClick={onClick}
		type="button"
	>
		{label}
		<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
	</button>
);
