import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeContent } from "@/lib/catalogue/content-blocks";
import type { ContentBlock } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

/**
 * `CatalogueContent` is the one place a `block.type` decides what renders, and
 * stored rows can still carry two legacy keys: `category` and `container`. No
 * read path - not the public page, not the API route, not the builder -
 * normalizes before this component, so it has to do it itself. Without the
 * normalize call a stored block hits no branch and the section renders blank,
 * with the row perfectly intact in the database.
 *
 * A source-level test because that failure is silent, and a component test
 * would need the whole builder context to reach the render loop.
 */
const source = readFileSync(
	fileURLToPath(
		new URL(
			"../../../src/components/catalogue/view/CatalogueContent.tsx",
			import.meta.url,
		),
	),
	"utf8",
);

describe("CatalogueContent legacy keys", () => {
	it("normalizes its content before matching on block.type", () => {
		expect(source).toContain("normalizeContent");
	});

	it("renders the canonical key", () => {
		expect(source).toContain('block.type === "custom_visual"');
	});
});

describe("normalizeContent covers every legacy key the renderer can meet", () => {
	const legacy = [
		{ id: "a", order: 0, type: "custom_visual", code: "<b>x</b>" },
		{ id: "b", order: 1, type: "category", name: "Drinks", items: [] },
		{ id: "c", order: 2, type: "container", name: "Internal", items: [] },
	] as unknown as ContentBlock[];

	it("maps the legacy keys to ones the renderer branches on", () => {
		const types = normalizeContent(legacy).map((block) => block.type);
		expect(types).toEqual(["custom_visual", "items", "items"]);
	});

	it("preserves order and length, so edit-callback indices stay valid", () => {
		const out = normalizeContent(legacy);
		expect(out).toHaveLength(legacy.length);
		expect(out.map((b) => b.order)).toEqual([0, 1, 2]);
		expect(out.map((b) => b.id)).toEqual(["a", "b", "c"]);
	});
});
