import type { ReactNode } from "react";

import { Container } from "@/components/general/Container";

/**
 * The auth shell: a full-height section with a faint grid and a centred amber
 * glow, holding one centred column (card, then the line under it).
 *
 * The navbar is fixed, so the top padding clears it. The navbar, footer and
 * `<main>` come from the `(site)` layouts, never from here.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<section className="relative isolate flex items-center overflow-hidden pb-[72px] pt-[120px] lg:min-h-screen lg:pb-[88px] lg:pt-[132px]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(22,20,15,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(22,20,15,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,#000_30%,transparent_100%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(720px,120vw)] w-[min(820px,140vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,176,32,0.24),rgba(255,176,32,0.08)_55%,transparent)]"
			/>
			<Container className="flex min-w-0 flex-col items-center">
				{children}
			</Container>
		</section>
	);
}
