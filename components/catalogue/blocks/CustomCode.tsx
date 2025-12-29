"use client";
import type { CustomCodeBlock } from "@/types/catalogue";
import { useEffect, useRef, useState } from "react";
import BlockControls from "../cards/common/BlockControls";

interface CustomCodeBlockProps {
	block: CustomCodeBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
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
	isFirst,
	isLast,
	mode,
}: CustomCodeBlockProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [iframeHeight, setIframeHeight] = useState(600);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe) return;

		const handleLoad = () => {
			try {
				const doc = iframe.contentDocument || iframe.contentWindow?.document;
				if (doc?.body) {
					const height = doc.body.scrollHeight;
					setIframeHeight(Math.max(height, 100));
				}
			} catch (e) {
				console.warn("Could not access iframe content for height adjustment");
			}
		};

		iframe.addEventListener("load", handleLoad);
		return () => iframe.removeEventListener("load", handleLoad);
	}, [block.code]);

	return (
		<section className="mb-5 group relative" id={`${slug}-${block.order}`}>
			{mode === "edit" && (
				<BlockControls
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
				/>
			)}
			<iframe
				ref={iframeRef}
				srcDoc={block.code}
				className="w-full border-0 rounded-lg overflow-hidden"
				style={{ minHeight: `${iframeHeight}px` }}
				sandbox="allow-scripts allow-same-origin"
				title="Custom code content"
			/>
		</section>
	);
};

export default CustomCodeBlockComponent;
