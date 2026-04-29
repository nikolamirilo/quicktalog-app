"use client";

import type { EmbeddingBlock } from "@quicktalog/common";
import { useEffect, useRef } from "react";
import HtmlContent from "../../general/HtmlContent";
import BlockControls from "../cards/common/BlockControls";

type EmbedType =
	| "maps"
	| "booking"
	| "media"
	| "commerce"
	| "social"
	| "unknown";

const URL_PATTERNS: Record<EmbedType, RegExp[]> = {
	maps: [
		/maps\.google/i,
		/maps\.google\.com/i,
		/google\.com\/maps/i,
		/bing\.com\/maps/i,
		/mapbox\.com/i,
		/openstreetmap/i,
		/yandex\.com\/maps/i,
	],
	booking: [
		/booking\.com/i,
		/expedia\.com/i,
		/hotels\.com/i,
		/airbnb/i,
		/tripadvisor\.com/i,
		/hrs\.de/i,
		/agoda\.com/i,
	],
	media: [
		/youtube\.com\/watch/i,
		/youtu\.be/i,
		/vimeo\.com/i,
		/dailymotion\.com/i,
		/twitch\.tv/i,
		/soundcloud\.com/i,
		/spotify\.com/i,
		/c.spotify.com/i,
		/mixcloud\.com/i,
	],
	commerce: [
		/stripe\.com/i,
		/paypal\.com/i,
		/gumroad\.com/i,
		/lemonsqueezy/i,
		/ko-fi\.com/i,
		/buymeacoffee/i,
		/paddle\.com/i,
	],
	social: [
		/facebook\.com\/plugins/i,
		/instagram\.com/i,
		/twitter\.com\/i\/spaces/i,
		/x\.com\/i\/spaces/i,
		/tiktok\.com/i,
		/linkedin\.com\/feed/i,
		/reddit\.com\/embed/i,
	],
	unknown: [],
};

function detectEmbedType(url: string): EmbedType {
	for (const [type, patterns] of Object.entries(URL_PATTERNS)) {
		if (type === "unknown") continue;
		for (const pattern of patterns) {
			if (pattern.test(url)) {
				return type as EmbedType;
			}
		}
	}
	return "unknown";
}

interface EmbeddingBlockProps {
	block: EmbeddingBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onEdit?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
}

const EmbeddingBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	onEdit,
	isFirst,
	isLast,
	mode,
}: EmbeddingBlockProps) => {
	const containerRef = useRef<HTMLElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	// Apply 100% width to embedded iframes and blockquotes
	useEffect(() => {
		if (!contentRef.current || !block.code) return;

		const applyEmbedStyles = () => {
			// Find all iframes
			const iframes = contentRef.current?.querySelectorAll("iframe");
			iframes?.forEach((iframe) => {
				const src = iframe.getAttribute("src") || "";
				const embedType = detectEmbedType(src);

				// Apply 100% width for all embed types
				iframe.style.width = "100%";

				// Set height based on embed type - use auto where possible
				if (embedType === "media" || embedType === "social") {
					// Video and social media embeds - maintain aspect ratio
					iframe.style.aspectRatio = "16/9";
					iframe.style.height = "100%";
					iframe.style.minHeight = "300px";
				} else if (embedType === "maps") {
					// Maps - use auto height with min
					iframe.style.height = "auto";
					iframe.style.minHeight = "400px";
				} else if (embedType === "booking") {
					// Booking widgets - use auto height with min
					iframe.style.height = "auto";
					iframe.style.minHeight = "500px";
				} else {
					// Default - set min-height but allow auto
					iframe.style.height = "auto";
					iframe.style.minHeight = "400px";
				}
			});

			// Find all blockquotes (commonly used for social media embeds)
			const blockquotes = contentRef.current?.querySelectorAll("blockquote");
			blockquotes?.forEach((blockquote) => {
				const style = blockquote.getAttribute("style") || "";
				const embedType = detectEmbedType(style);

				// Apply width 100%
				blockquote.style.width = "100%";
				blockquote.style.maxWidth = "100%";

				if (embedType === "social" || embedType === "media") {
					blockquote.style.minHeight = "300px";
				}
			});

			// Find all embeds and other elements
			const embedElements = contentRef.current?.querySelectorAll(
				"embed, object, video",
			);
			embedElements?.forEach((el) => {
				(el as HTMLElement).style.width = "100%";
				(el as HTMLElement).style.maxWidth = "100%";
				(el as HTMLElement).style.height = "auto";
			});
		};

		// Run after a short delay to ensure HTML is rendered
		const timer = setTimeout(applyEmbedStyles, 100);

		// Also run when DOM changes
		const observer = new MutationObserver(() => {
			applyEmbedStyles();
		});

		if (contentRef.current) {
			observer.observe(contentRef.current, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["src", "style"],
			});
		}

		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	}, [block.code]);

	useEffect(() => {
		if (!containerRef.current || !block.code) return;
		const oldScripts = Array.from(
			containerRef.current.querySelectorAll("script"),
		);
		const newScripts: HTMLScriptElement[] = [];

		const loadScripts = async () => {
			for (const oldScript of oldScripts) {
				await new Promise<void>((resolve) => {
					const newScript = document.createElement("script");

					// Copy all attributes
					Array.from(oldScript.attributes).forEach((attr) => {
						newScript.setAttribute(attr.name, attr.value);
					});

					// Copy inline content if any
					if (oldScript.innerHTML) {
						newScript.innerHTML = oldScript.innerHTML;
					} else if (oldScript.textContent) {
						newScript.textContent = oldScript.textContent;
					}

					if (newScript.src) {
						newScript.onload = () => resolve();
						newScript.onerror = () => resolve();
					}

					// Insert the new script exactly where the old one was
					if (oldScript.parentNode) {
						oldScript.parentNode.replaceChild(newScript, oldScript);
					} else {
						containerRef.current?.appendChild(newScript);
					}

					newScripts.push(newScript);

					if (!newScript.src) {
						resolve();
					}
				});
			}
		};

		loadScripts();

		return () => {
			newScripts.forEach((script) => {
				if (script.parentNode) {
					script.parentNode.removeChild(script);
				}
			});
		};
	}, [block.code]);

	return (
		<section
			className="mb-5 group relative"
			id={`${slug}-${block.order}`}
			ref={containerRef}
		>
			{mode === "edit" && (
				<BlockControls
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			{block.code ? (
				<div className="w-full rounded-lg overflow-hidden bg-transparent">
					<div className="bg-transparent w-full h-auto" ref={contentRef}>
						<HtmlContent
							className="bg-transparent w-full h-auto"
							html={block.code}
						/>
					</div>
				</div>
			) : (
				<div className="w-full p-8 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
					No embed code provided
				</div>
			)}
		</section>
	);
};

export default EmbeddingBlockComponent;
