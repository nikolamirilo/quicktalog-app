"use client";
import type { CustomCodeBlock } from "@quicktalog/common";
import { useEffect, useRef, useState } from "react";
import BlockControls from "../cards/common/BlockControls";

interface CustomCodeBlockProps {
	block: CustomCodeBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onEdit?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
}

const CustomCodeBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	onEdit,
	isFirst,
	isLast,
	mode,
}: CustomCodeBlockProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [iframeHeight, setIframeHeight] = useState(200);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		let observer: ResizeObserver | null = null;

		const updateHeight = () => {
			try {
				const doc = iframe.contentDocument || iframe.contentWindow?.document;
				if (doc?.body) {
					// Add a small buffer to prevent potential scrollbar flickering
					const height =
						doc.documentElement.scrollHeight || doc.body.scrollHeight;
					setIframeHeight(Math.max(height, 100));
				}
			} catch (e) {
				console.warn("Could not access iframe content for height adjustment");
			}
		};

		const handleLoad = () => {
			updateHeight();
			try {
				const doc = iframe.contentDocument || iframe.contentWindow?.document;
				if (doc?.body) {
					observer?.disconnect();
					observer = new ResizeObserver(updateHeight);
					observer.observe(doc.body);
					// Also observe document element in case layout depends on it
					if (doc.documentElement) {
						observer.observe(doc.documentElement);
					}
				}
			} catch (e) {
				// Ignore errors if cross-origin (though srcDoc should be fine with allow-same-origin)
			}
		};

		iframe.addEventListener("load", handleLoad);

		// Attempt to setup if already loaded
		if (iframe.contentDocument?.readyState === "complete") {
			handleLoad();
		}

		return () => {
			iframe.removeEventListener("load", handleLoad);
			observer?.disconnect();
		};
	}, [block.code]);

	return (
		<section className="mb-5 group relative" id={`${slug}-${block.order}`}>
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
			<iframe
				className="w-full border-0 rounded-lg overflow-hidden"
				ref={iframeRef}
				sandbox="allow-scripts allow-same-origin"
				srcDoc={block.code}
				style={{ minHeight: `${iframeHeight}px`, height: "fit-content" }}
				title="Custom code content"
			/>
		</section>
	);
};

export default CustomCodeBlockComponent;
