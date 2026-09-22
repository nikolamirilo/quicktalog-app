import type { ReactNode } from "react";

/** The closing row under a card's form, above the card's edge. */
export default function AuthFooter({ children }: { children: ReactNode }) {
	return (
		<div className="mt-6 border-t border-product-border pt-5 text-center text-sm text-product-foreground-accent">
			{children}
		</div>
	);
}
