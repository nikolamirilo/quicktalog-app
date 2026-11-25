"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { YOUTUBE_DEMO_ID } from "@/constants/marketing";

const EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_DEMO_ID}?autoplay=1&rel=0&modestbranding=1`;
const POSTER = `https://i.ytimg.com/vi/${YOUTUBE_DEMO_ID}/maxresdefault.jpg`;
/** maxres exists only for videos uploaded at 720p or above; mqdefault always does. */
const POSTER_FALLBACK = `https://i.ytimg.com/vi/${YOUTUBE_DEMO_ID}/mqdefault.jpg`;

/**
 * The YouTube demo in a dark panel. The player is mounted on click, so the page
 * never pays for YouTube's iframe on load: until then this is one poster image.
 */
export function DemoVideo() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [poster, setPoster] = useState(POSTER);

	if (!YOUTUBE_DEMO_ID) return null;

	return (
		<div className="relative">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-[10%] inset-y-[14%] rounded-full bg-product-primary/25 blur-[80px]"
			/>
			<div className="relative aspect-video overflow-hidden rounded-product-panel border border-product-border bg-product-dark shadow-[0_30px_60px_-30px_rgb(var(--product-foreground-rgb)/0.3),var(--product-shadow)]">
				{isPlaying ? (
					<iframe
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
						className="absolute inset-0 h-full w-full border-0"
						src={EMBED_URL}
						title="Quicktalog demo"
					/>
				) : (
					<button
						aria-label="Play the Quicktalog demo video"
						className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-product-primary"
						onClick={() => setIsPlaying(true)}
						type="button"
					>
						<img
							alt=""
							className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							loading="lazy"
							onError={() => setPoster(POSTER_FALLBACK)}
							src={poster}
						/>
						<span
							aria-hidden="true"
							className="absolute inset-0 bg-product-dark/35 transition-colors duration-300 group-hover:bg-product-dark/20"
						/>
						<span className="absolute inset-0 flex flex-col items-center justify-center gap-3.5">
							<span className="grid h-[68px] w-[68px] place-items-center rounded-full bg-product-primary shadow-product-primary transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110">
								<Play
									aria-hidden="true"
									className="h-7 w-7 translate-x-[2px] fill-current text-product-foreground"
								/>
							</span>
							<span className="font-product-heading text-[15px] font-semibold text-white drop-shadow-[0_1px_8px_rgb(0_0_0/0.55)] sm:text-base">
								Watch the demo
							</span>
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
