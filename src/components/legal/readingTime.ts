import { isValidElement, type ReactNode } from "react";

const WORDS_PER_MINUTE = 200;

/** The visible text of a JSX tree, walking element children. */
function textOf(node: ReactNode): string {
	if (node === null || node === undefined || typeof node === "boolean") {
		return "";
	}
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join(" ");
	if (isValidElement<{ children?: ReactNode }>(node)) {
		return textOf(node.props.children);
	}
	return "";
}

/** Minutes to read the given content at about 200 words a minute (at least 1). */
export function readingMinutes(...nodes: ReactNode[]): number {
	const words = nodes.map(textOf).join(" ").split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
