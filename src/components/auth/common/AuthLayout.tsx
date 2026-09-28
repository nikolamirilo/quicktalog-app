import type { ReactNode } from "react";

/**
 * Centres an auth card between the fixed navbar and the footer, on the tinted
 * ground so the white card reads as a distinct surface.
 *
 * One `min-h-screen` box, not two: the previous `mt-[5vh] min-h-screen` inside
 * another `min-h-screen` made the page 105vh of mostly empty space and pushed
 * the card below the fold. `py-28` clears the fixed navbar at the top and keeps
 * the footer off the card at the bottom.
 *
 * The tint sits on the inner element because `.product` sets its own background
 * on the element that carries the class.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="product font-lora">
			<div className="flex min-h-screen items-center justify-center bg-product-background-hero px-4 py-28">
				<div className="w-full max-w-[27rem]">{children}</div>
			</div>
		</div>
	);
}
