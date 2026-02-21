"use client";

import type { CustomCodeBlock } from "@quicktalog/common";
import { useEffect, useRef } from "react";
import HtmlContent from "../../general/HtmlContent";
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
	const containerRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;
		const oldScripts = Array.from(containerRef.current.querySelectorAll("script"));
		const newScripts: HTMLScriptElement[] = [];

		const loadScripts = async () => {
			for (const oldScript of oldScripts) {
				await new Promise<void>((resolve) => {
					const newScript = document.createElement("script");
					Array.from(oldScript.attributes).forEach((attr) => {
						newScript.setAttribute(attr.name, attr.value);
					});
					newScript.textContent = oldScript.textContent;

					if (newScript.src) {
						newScript.onload = () => resolve();
						newScript.onerror = () => resolve();
					}

					document.body.appendChild(newScript);
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
		<section ref={containerRef} className="mb-5 group relative" id={`${slug}-${block.order}`}>
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
			<HtmlContent html={block.code} />
		</section>
	);
};

export default CustomCodeBlockComponent;
