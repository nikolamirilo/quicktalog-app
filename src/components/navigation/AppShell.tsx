import type { ReactNode } from "react";

import { Container } from "@/components/general/Container";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { cn } from "@/lib/ui/cn";

type AppShellProps = {
	children: ReactNode;
	/** Analytics owns the viewport height, so it hides the footer. */
	footer?: boolean;
	className?: string;
};

/**
 * Signed-in frame for app pages (`.as-wrap` in the design): navbar, a 1280px
 * page area with the top padding the fixed navbar needs, an amber glow at the
 * top right, and the footer.
 */
export function AppShell({
	children,
	footer = true,
	className,
}: AppShellProps) {
	return (
		<>
			<Navbar />
			<Container
				as="main"
				className={cn(
					"relative isolate px-4 pb-14 pt-24 md:px-6 md:pb-[72px] md:pt-28 lg:px-8 lg:pb-[88px] lg:pt-[120px]",
					className,
				)}
				id="main"
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute right-[-6%] top-[60px] -z-10 h-[460px] w-[460px] max-w-full rounded-full bg-product-primary/[0.12] blur-[110px]"
				/>
				{children}
			</Container>
			{footer && <Footer />}
		</>
	);
}
