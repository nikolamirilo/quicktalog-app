import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

// Frozen copy of the pre-redesign outline button: the published catalogue is themed by
// `--catalogue-*` and must not follow product `Button` changes.
const baseClasses =
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none duration-200 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-[#eaeaea] bg-transparent text-[#171717] hover:bg-[#fff9e5] hover:text-[#454545] transition-colors shadow-sm";

const sizeClasses = {
	default: "h-9 px-4 py-2",
	lg: "h-10 px-8",
};

type CatalogueButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean;
	size?: keyof typeof sizeClasses;
};

const CatalogueButton = React.forwardRef<
	HTMLButtonElement,
	CatalogueButtonProps
>(({ className, asChild = false, size = "default", ...props }, ref) => {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			className={cn(baseClasses, sizeClasses[size], className)}
			ref={ref}
			{...props}
		/>
	);
});
CatalogueButton.displayName = "CatalogueButton";

export { CatalogueButton };
