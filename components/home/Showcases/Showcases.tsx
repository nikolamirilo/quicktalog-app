"use client";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ShowcaseItem = { src: string; title: string };

const DESKTOP_ZOOM = 0.75;
const DESKTOP_INV = `${((1 / DESKTOP_ZOOM) * 100).toFixed(4)}%`;

const SWIPE_DISTANCE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 300;

export default function SwiperCarousel({ data }: { data: ShowcaseItem[] }) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isDesktop, setIsDesktop] = useState(false);
	const active = data[activeIndex];

	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1024px)");
		const update = () => setIsDesktop(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);

	const handleSelect = (index: number) => {
		if (index !== activeIndex) setActiveIndex(index);
	};

	const goPrev = () => {
		setActiveIndex((i) => (i === 0 ? data.length - 1 : i - 1));
	};

	const goNext = () => {
		setActiveIndex((i) => (i === data.length - 1 ? 0 : i + 1));
	};

	const handleDragEnd = (
		_e: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo,
	) => {
		const { offset, velocity } = info;
		if (
			offset.x < -SWIPE_DISTANCE_THRESHOLD ||
			velocity.x < -SWIPE_VELOCITY_THRESHOLD
		) {
			goNext();
		} else if (
			offset.x > SWIPE_DISTANCE_THRESHOLD ||
			velocity.x > SWIPE_VELOCITY_THRESHOLD
		) {
			goPrev();
		}
	};

	return (
		<div className="w-full max-w-full lg:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
			{/* ── Mobile header: chevrons + title ─────────────────────── */}
			<div className="lg:hidden mb-5 px-1">
				<div className="flex items-center gap-2">
					<button
						aria-label="Previous catalogue"
						className="flex-shrink-0 w-9 h-9 rounded-full bg-product-background border border-product-border flex items-center justify-center text-product-foreground active:scale-95 transition-transform"
						onClick={goPrev}
						type="button"
					>
						<ChevronLeft size={18} />
					</button>
					<div className="min-w-0 flex-1 overflow-hidden">
						<AnimatePresence mode="wait">
							<motion.p
								animate={{ opacity: 1, y: 0 }}
								className="block text-lg font-medium text-product-foreground truncate text-center"
								exit={{ opacity: 0, y: -4 }}
								initial={{ opacity: 0, y: 4 }}
								key={`title-${activeIndex}`}
								transition={{ duration: 0.18 }}
							>
								{active.title}
							</motion.p>
						</AnimatePresence>
					</div>
					<button
						aria-label="Next catalogue"
						className="flex-shrink-0 w-9 h-9 rounded-full bg-product-background border border-product-border flex items-center justify-center text-product-foreground active:scale-95 transition-transform"
						onClick={goNext}
						type="button"
					>
						<ChevronRight size={18} />
					</button>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-4 lg:h-[660px] w-full">
				{/* ── Desktop sidebar ─────────────────────────────────── */}
				<div className="hidden lg:flex lg:w-72 flex-shrink-0 flex-col rounded-2xl border border-product-border bg-product-background overflow-hidden">
					<div className="px-5 py-4 border-b border-product-border">
						<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-product-foreground-accent">
							Catalogues
						</p>
						<p className="text-xs text-product-foreground-accent/70 mt-0.5">
							{data.length} live examples
						</p>
					</div>

					<nav
						aria-label="Catalogue list"
						className="flex-1 overflow-y-auto py-2 px-2"
						style={{ scrollbarWidth: "none" }}
					>
						{data.map((item, index) => (
							<button
								className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
									index === activeIndex
										? "bg-product-background-hover text-product-foreground"
										: "text-product-foreground-accent hover:text-product-foreground hover:bg-product-background-hero"
								}`}
								key={`nav-${index}`}
								onClick={() => handleSelect(index)}
								type="button"
							>
								{index === activeIndex && (
									<motion.div
										className="absolute left-0 inset-y-2 w-[3px] rounded-full bg-product-primary"
										layoutId="sidebar-indicator"
									/>
								)}

								<span className="ml-2 font-mono text-[10px] text-product-foreground-accent/60 flex-shrink-0 w-5">
									{String(index + 1).padStart(2, "0")}
								</span>

								<span
									className={`text-[13px] font-medium leading-snug flex-1 min-w-0 truncate transition-colors ${
										index === activeIndex
											? "text-product-foreground"
											: "text-product-foreground-accent group-hover:text-product-foreground"
									}`}
								>
									{item.title}
								</span>

								{index === activeIndex && (
									<span className="w-1.5 h-1.5 rounded-full bg-product-primary flex-shrink-0 animate-pulse" />
								)}
							</button>
						))}
					</nav>

					<div className="p-4 border-t border-product-border">
						<Button asChild size="lg" variant="cta">
							<Link
								className="flex items-center justify-center gap-2"
								href={active.src}
								rel="noopener noreferrer"
								target="_blank"
							>
								<span>Visit Catalogue</span>
								<ExternalLink size={14} />
							</Link>
						</Button>
					</div>
				</div>

				{/* ── Browser window ─────────────────────────────────────── */}
				<div className="flex-1 min-w-0 w-full max-w-full flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-product-border shadow-product-shadow h-[87vh] min-h-[525px] max-h-[800px] lg:h-auto lg:max-h-none">
					{/* Chrome header */}
					<div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 h-9 sm:h-11 bg-product-background-hero border-b border-product-border">
						<div className="hidden sm:flex gap-1.5 flex-shrink-0">
							<span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
							<span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
							<span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
						</div>

						<div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 bg-product-background rounded-md px-2 sm:px-3 h-6 sm:h-7 border border-product-border overflow-hidden">
							<Globe className="text-product-icon flex-shrink-0 w-2.5 h-2.5" />
							<div className="flex-1 min-w-0 overflow-hidden">
								<AnimatePresence mode="wait">
									<motion.span
										animate={{ opacity: 1, y: 0 }}
										className="block text-[10px] sm:text-[11px] text-product-foreground-accent font-mono truncate"
										exit={{ opacity: 0, y: -3 }}
										initial={{ opacity: 0, y: 3 }}
										key={`url-${activeIndex}`}
										transition={{ duration: 0.15 }}
									>
										{active.src}
									</motion.span>
								</AnimatePresence>
							</div>
						</div>

						<Link
							aria-label="Open catalogue in new tab"
							className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-product-foreground-accent hover:text-product-foreground bg-product-background hover:bg-product-background-hover border border-product-border rounded-md px-2 sm:px-2.5 h-6 sm:h-7 transition-all duration-200"
							href={active.src}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink className="w-2.5 h-2.5" />
							<span className="hidden sm:inline">Open</span>
						</Link>
					</div>

					{/* Iframe stage - swipeable on mobile */}
					<motion.div
						className="flex-1 relative bg-white overflow-hidden touch-pan-y"
						drag={isDesktop ? false : "x"}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.18}
						dragMomentum={false}
						onDragEnd={handleDragEnd}
					>
						<AnimatePresence mode="wait">
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="absolute inset-0 overflow-hidden"
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								key={`frame-${activeIndex}`}
								transition={{ duration: 0.22, ease: "easeOut" }}
							>
								{isDesktop ? (
									<iframe
										className="absolute top-0 left-0 border-none"
										height={DESKTOP_INV}
										loading="lazy"
										src={active.src}
										style={{
											transform: `scale(${DESKTOP_ZOOM})`,
											transformOrigin: "top left",
										}}
										title={active.title}
										width={DESKTOP_INV}
									/>
								) : (
									<iframe
										className="block w-full h-full border-none pointer-events-none"
										loading="lazy"
										src={active.src}
										title={active.title}
									/>
								)}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				</div>
			</div>

			{/* ── Mobile dot indicator + CTA ─────────────────────────── */}
			<div className="lg:hidden mt-3 flex flex-col items-center gap-3">
				<div
					aria-label="Catalogue position"
					className="flex items-center justify-center gap-1.5"
					role="tablist"
				>
					{data.map((_, index) => {
						const isActive = index === activeIndex;
						return (
							<button
								aria-label={`Go to catalogue ${index + 1}`}
								aria-selected={isActive}
								className={`h-1.5 rounded-full transition-all duration-300 ${
									isActive
										? "w-6 bg-product-primary"
										: "w-1.5 bg-product-border hover:bg-product-foreground-accent/40"
								}`}
								key={`dot-${index}`}
								onClick={() => handleSelect(index)}
								role="tab"
								type="button"
							/>
						);
					})}
				</div>

				<Button asChild className="w-full" size="lg" variant="cta">
					<Link
						className="flex items-center justify-center gap-2"
						href={active.src}
						rel="noopener noreferrer"
						target="_blank"
					>
						<span>Visit Catalogue</span>
						<ExternalLink size={14} />
					</Link>
				</Button>
			</div>
		</div>
	);
}
