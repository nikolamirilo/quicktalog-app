"use client";

import { useEffect, useState } from "react";

/**
 * Thin reading-progress bar pinned to the very top of the viewport. Fills with
 * the brand amber as the reader scrolls through the article.
 */
export default function ReadingProgress() {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const update = () => {
			const el = document.documentElement;
			const scrollable = el.scrollHeight - el.clientHeight;
			setProgress(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0);
		};
		update();
		window.addEventListener("scroll", update, { passive: true });
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update);
			window.removeEventListener("resize", update);
		};
	}, []);

	return (
		<div
			aria-hidden
			className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent"
		>
			<div
				className="h-full bg-product-primary transition-[width] duration-150 ease-out"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}
