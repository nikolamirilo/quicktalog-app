import { Info } from "lucide-react";

import { isLogoHidden } from "@/lib/catalogue/logo";

/** Tells the user why their uploaded logo is not showing in the catalogue. */
export function LogoHint(props: {
	logo: string | undefined;
	headerType: string | undefined;
	footerType: string | undefined;
}) {
	if (!isLogoHidden(props)) return null;

	return (
		<p className="mt-2 flex items-start gap-2 rounded-lg bg-product-background-hero px-3 py-2 text-xs text-product-foreground-accent">
			<Info aria-hidden="true" className="mt-px size-3.5 flex-none" />
			Your logo shows in a custom header or footer. Turn on Customize header in
			the Header tab to show it.
		</p>
	);
}
