"use client";

import type { CustomCodeBlock } from "@quicktalog/common";
import { useEffect, useRef } from "react";
import BlockControls from "../cards/common/BlockControls";

/**
 * Script types the browser will execute. Anything else (JSON, templates,
 * importmaps) is inert data that must be left exactly as authored.
 */
const EXECUTABLE_SCRIPT_TYPES = new Set([
	"",
	"module",
	"text/javascript",
	"application/javascript",
	"text/ecmascript",
	"application/ecmascript",
]);

export const isExecutableScript = (script: HTMLScriptElement): boolean =>
	EXECUTABLE_SCRIPT_TYPES.has(
		(script.getAttribute("type") ?? "").toLowerCase(),
	);

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
	const hostRef = useRef<HTMLDivElement>(null);

	// The block's markup is mounted by hand rather than with
	// `dangerouslySetInnerHTML`. React re-applies that prop on later renders even
	// when the HTML is unchanged, which tears out the live DOM a widget has been
	// drawing into and restores the original <script> tags — and a script parsed
	// from innerHTML is flagged "already started", so it can never run again. The
	// result is a widget that renders once and then goes blank. Owning the
	// subtree here keeps React out of it entirely.
	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		host.innerHTML = block.code;

		// A script inserted via innerHTML never executes; it has to be replaced by
		// a freshly created node. Done synchronously so React's double-invoked
		// effects cannot interleave.
		for (const oldScript of Array.from(host.querySelectorAll("script"))) {
			// Only executable scripts need re-creating. A data block such as
			// <script type="application/json"> is content, not code — replacing it
			// would break the very script that reads it back.
			if (!isExecutableScript(oldScript)) continue;

			const newScript = document.createElement("script");
			for (const attr of Array.from(oldScript.attributes)) {
				newScript.setAttribute(attr.name, attr.value);
			}
			newScript.textContent = oldScript.textContent;
			// Dynamically inserted scripts default to async; keep source order.
			if (newScript.src) newScript.async = false;

			oldScript.replaceWith(newScript);
		}

		return () => {
			// Full teardown: the next run rebuilds from `block.code` and re-runs the
			// scripts, so re-mounting is idempotent.
			host.innerHTML = "";
		};
	}, [block.code]);

	return (
		<section
			aria-label={block.name || undefined}
			className="mb-5 group relative bg-transparent"
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
			<div className="bg-transparent" ref={hostRef} />
		</section>
	);
};

export default CustomCodeBlockComponent;
