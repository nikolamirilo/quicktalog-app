"use client";

import { useMemo } from "react";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { diffAiReview } from "@/lib/catalogue/ai-review";

/** Amber outline and tag, readable on light and dark catalogues alike. */
const HIGHLIGHT = "#ffb020";

/** `value` quoted for a CSS attribute selector. */
const quoted = (value: string) => `"${value.replace(/["\\]/g, "\\$&")}"`;

/**
 * Outlines what the AI changed while its edits wait for review, and tags the
 * changed items with an "AI edit" tab hanging from the card's top-left edge
 * (cards clip their overflow, so the tab sits flush inside the edge). It is CSS keyed on the ids sections and cards already render,
 * so no layout has to know about reviews. Builder only.
 */
export function AiReviewHighlights() {
	const context = useCatalogueContext();
	const review = context?.aiReview;
	const catalogue = context?.catalogue;

	const css = useMemo(() => {
		if (!review || !catalogue) return "";
		const { sectionIds, itemIds } = diffAiReview(review.before, catalogue);
		const sections = sectionIds.flatMap((id) => {
			const block = catalogue.content.find((entry) => entry.id === id);
			return block ? [`[id=${quoted(`${block.id}-${block.order}`)}]`] : [];
		});
		const items = itemIds.map((id) => `[data-item-id=${quoted(id)}]`);

		const rules: string[] = [];
		if (sections.length > 0) {
			rules.push(
				`${sections.join(",")}{outline:2px dashed ${HIGHLIGHT};outline-offset:6px;border-radius:12px}`,
			);
		}
		if (items.length > 0) {
			rules.push(
				`${items.join(",")}{outline:2px solid ${HIGHLIGHT};outline-offset:2px}`,
				`${items.map((selector) => `${selector}::after`).join(",")}{content:"AI edit";position:absolute;top:0;left:12px;z-index:5;padding:1px 8px 2px;border-radius:0 0 8px 8px;background:${HIGHLIGHT};color:#16140f;font:700 11px/1.5 system-ui,sans-serif;pointer-events:none}`,
			);
		}
		return rules.join("");
	}, [review, catalogue]);

	if (!css) return null;
	return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
