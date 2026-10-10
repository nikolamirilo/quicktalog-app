"use client";

import { Lock, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrowserChrome } from "@/components/general/BrowserChrome";
import { TOUR_URL } from "@/constants/marketing";
import { cn } from "@/lib/ui/cn";

/** Extra time after `load` so the tour has painted before the skeleton fades. */
const REVEAL_DELAY_MS = 800;

/**
 * The Hexus product tour in a browser-style frame, with a skeleton until it
 * loads. The iframe is mounted after hydration, so its `load` event can never
 * fire before React is listening and leave the skeleton up for good.
 */
export function DemoTour() {
	const [mounted, setMounted] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const revealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		setMounted(true);
		return () => clearTimeout(revealTimer.current);
	}, []);

	const onLoad = () => {
		clearTimeout(revealTimer.current);
		revealTimer.current = setTimeout(() => setIsLoaded(true), REVEAL_DELAY_MS);
	};

	return (
		<div className="relative mx-auto aspect-[4/5] max-w-[1152px] overflow-hidden rounded-product-panel border border-product-border bg-product-card shadow-[0_30px_60px_-30px_rgb(var(--product-foreground-rgb)/0.28),var(--product-shadow)] min-[600px]:aspect-video">
			<div
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute inset-0 z-10 flex flex-col transition-opacity duration-500",
					isLoaded ? "opacity-0" : "opacity-100",
				)}
			>
				<BrowserChrome
					className="gap-3 bg-product-card px-4 py-[11px] sm:px-4"
					icon={<Lock className="h-3 w-3" />}
					pillClassName="mx-auto h-6 max-w-[420px] justify-center gap-1.5 bg-product-background-hero text-xs"
					url="quicktalog.app"
				/>
				<div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(60%_70%_at_50%_40%,var(--product-primary-soft),var(--product-background)_70%)]">
					<div className="absolute inset-x-[12%] inset-y-[8%] flex flex-col items-center gap-3.5 opacity-70 blur-[10px]">
						<i className="h-[13%] w-[70%] animate-pulse rounded-[14px] bg-product-border-strong" />
						<i className="h-[9%] w-[45%] animate-pulse rounded-[14px] bg-product-border-strong" />
					</div>
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-product-background/35 p-4 text-center backdrop-blur-[2px]">
						<p className="max-w-[820px] font-product-heading text-[clamp(16px,2.6vw,30px)] font-extrabold leading-[1.2] tracking-[-0.025em]">
							Quicktalog - Create Stunning Digital Catalogs in Minutes
						</p>
						<span className="inline-flex h-11 items-center gap-2 rounded-full bg-product-primary px-[22px] text-[15px] font-semibold shadow-product-primary">
							<Play className="h-4 w-4 fill-current" />
							Loading tour…
						</span>
					</div>
				</div>
				<div className="flex flex-none items-center gap-3 border-t border-product-border bg-product-card px-4 py-2.5 text-product-foreground-accent">
					<Play className="h-4 w-4" />
					<span className="h-[5px] flex-1 overflow-hidden rounded-full bg-product-border">
						<b className="block h-full w-[4%] bg-product-primary" />
					</span>
				</div>
			</div>

			{mounted && (
				<iframe
					allowFullScreen
					className={cn(
						"absolute inset-0 h-full w-full border-0 transition-opacity duration-500",
						isLoaded ? "opacity-100" : "opacity-0",
					)}
					onLoad={onLoad}
					src={TOUR_URL}
					title="Quicktalog interactive demo"
				/>
			)}
		</div>
	);
}
