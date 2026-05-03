"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Globe } from "lucide-react";
import { useState } from "react";

type ShowcaseItem = { src: string; title: string };

// Scale the iframe down to 75% so more of the desktop layout is visible.
// The iframe is rendered at 133.33% dimensions then visually reduced via
// transform: scale(0.75) from the top-left corner, filling the container exactly.
const ZOOM = 0.75;
const INV = `${((1 / ZOOM) * 100).toFixed(4)}%`;

export default function SwiperCarousel({ data }: { data: ShowcaseItem[] }) {
	const [activeIndex, setActiveIndex] = useState(0);
	const active = data[activeIndex];

	const handleSelect = (index: number) => {
		if (index !== activeIndex) setActiveIndex(index);
	};

	return (
		<div className="w-full max-w-[1400px] mx-auto px-4 lg:px-8">
			<div className="flex flex-col lg:flex-row gap-4 lg:h-[660px]">
				{/* ── Sidebar ────────────────────────────────────────────── */}
				<div className="lg:w-72 flex-shrink-0 flex flex-col rounded-2xl border border-white/8 bg-[#09090f] overflow-hidden">
					<div className="px-5 py-4 border-b border-white/8">
						<p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
							Catalogues
						</p>
						<p className="text-xs text-gray-600 mt-0.5">
							{data.length} live examples
						</p>
					</div>

					<nav
						aria-label="Catalogue list"
						className="flex-1 overflow-y-auto py-2 px-2 scrollbar-none"
					>
						{data.map((item, index) => (
							<button
								className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group ${
									index === activeIndex
										? "bg-white/8 text-white"
										: "text-gray-500 hover:text-gray-200 hover:bg-white/4"
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

								<span className="ml-2 font-mono text-[10px] text-gray-600 flex-shrink-0 w-5">
									{String(index + 1).padStart(2, "0")}
								</span>

								<span
									className={`text-[13px] font-medium leading-snug flex-1 min-w-0 truncate transition-colors ${
										index === activeIndex
											? "text-white"
											: "text-gray-500 group-hover:text-gray-200"
									}`}
								>
									{item.title}
								</span>

								{index === activeIndex && (
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
								)}
							</button>
						))}
					</nav>

					<div className="p-4 border-t border-white/8">
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
				<div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.55)] min-w-0 h-[480px] lg:h-auto">
					{/* Chrome header */}
					<div className="flex-shrink-0 flex items-center gap-3 px-4 h-11 bg-[#0e0e1a] border-b border-white/10">
						<div className="flex gap-1.5 flex-shrink-0">
							<span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
							<span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
							<span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
						</div>

						<div className="flex-1 flex items-center gap-2 bg-white/5 rounded-md px-3 h-7 border border-white/6 min-w-0 overflow-hidden">
							<Globe className="text-emerald-400/70 flex-shrink-0" size={10} />
							<AnimatePresence mode="wait">
								<motion.span
									animate={{ opacity: 1, y: 0 }}
									className="text-[11px] text-gray-400 font-mono truncate"
									exit={{ opacity: 0, y: -3 }}
									initial={{ opacity: 0, y: 3 }}
									key={`url-${activeIndex}`}
									transition={{ duration: 0.15 }}
								>
									{active.src}
								</motion.span>
							</AnimatePresence>
						</div>

						<Link
							className="flex-shrink-0 flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white bg-white/4 hover:bg-white/8 border border-white/8 rounded-md px-2.5 h-7 transition-all duration-200"
							href={active.src}
							rel="noopener noreferrer"
							target="_blank"
						>
							<ExternalLink size={10} />
							<span>Open</span>
						</Link>
					</div>

					{/* Iframe stage */}
					<div className="flex-1 relative bg-white overflow-hidden">
						<AnimatePresence mode="wait">
							<motion.div
								animate={{ opacity: 1 }}
								className="absolute inset-0"
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								key={`frame-${activeIndex}`}
								transition={{ duration: 0.25, ease: "easeInOut" }}
							>
								<iframe
									className="absolute top-0 left-0 border-none"
									height={INV}
									loading="lazy"
									src={active.src}
									style={{
										transform: `scale(${ZOOM})`,
										transformOrigin: "top left",
									}}
									title={active.title}
									width={INV}
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}
