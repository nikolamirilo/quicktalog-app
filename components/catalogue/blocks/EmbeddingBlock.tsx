"use client";

import type { EmbeddingBlock } from "@quicktalog/common";
import { useEffect, useRef } from "react";
import HtmlContent from "../../general/HtmlContent";
import BlockControls from "../cards/common/BlockControls";

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
			ref={containerRef}
			className="mb-5 group relative"
			id={`${slug}-${block.order}`}
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
					<HtmlContent className="bg-transparent" html={block.code} />
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
