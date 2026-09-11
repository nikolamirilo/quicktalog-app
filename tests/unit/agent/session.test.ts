import { CatalogueSession } from "@/agent/session";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const catalogue = {
	...defaultCatalogueData,
	id: "cat-1",
	name: "cafe",
	content: [
		{
			id: "sec-1",
			order: 0,
			type: "category",
			name: "Drinks",
			layout: "variant_1",
			isExpanded: true,
			items: [
				{
					id: "it-1",
					order: 0,
					name: "Espresso",
					description: "",
					image: "",
					price: 2.5,
					isFree: false,
				},
			],
		},
		{
			id: "sec-2",
			order: 1,
			type: "text",
			name: "About",
			content: "<p>We roast every Tuesday.</p>",
		},
	],
} as Catalogue;

const session = () => new CatalogueSession(catalogue);

/** The content union has no `items` on every branch; these fixtures do. */
const itemsOf = (c: Catalogue, index: number) =>
	(c.content[index] as { items: Array<{ id: string; price: number }> }).items;

describe("CatalogueSession", () => {
	describe("index resolution", () => {
		it("resolves a section index to its stable id", () => {
			expect(session().resolveSection(0)).toEqual({ id: "sec-1" });
		});

		it("explains an out-of-range section instead of dropping it", () => {
			const result = session().resolveSection(7);

			// The model reads this back and corrects itself, which is the whole
			// reason a bad index is no longer a silent no-op.
			expect(result).toEqual({
				error: expect.stringContaining("no section [7]"),
			});
			expect((result as { error: string }).error).toContain("2 section(s)");
		});

		it("rejects item operations on a block that cannot hold items", () => {
			const result = session().resolveItemSection(1);

			expect((result as { error: string }).error).toContain(
				'is a "text" section',
			);
		});

		it("explains an out-of-range item", () => {
			const result = session().resolveItem(0, 9);

			expect((result as { error: string }).error).toContain("no item [9]");
		});
	});

	describe("run", () => {
		it("applies an edit, records it and reports a summary", () => {
			const s = session();
			const result = s.run({
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				price: 3,
			});

			expect(result.ok).toBe(true);
			expect(s.operations).toHaveLength(1);
			expect(s.applied).toHaveLength(1);
			expect(itemsOf(s.working, 0)[0].price).toBe(3);
		});

		it("leaves the working copy untouched when nothing applied", () => {
			const s = session();
			const result = s.run({
				op: "update_section",
				sectionId: "does-not-exist",
				name: "Nope",
			});

			expect(result).toEqual({ ok: false, error: expect.any(String) });
			expect(s.operations).toHaveLength(0);
			expect(s.working).toBe(catalogue);
		});

		it("reports a plan limit back as a tool error", () => {
			// One counted section already exists; `text` blocks are exempt.
			const s = new CatalogueSession(catalogue, { sections: 1 });
			const result = s.run({
				op: "add_section",
				id: "sec-3",
				sectionType: "category",
				name: "Food",
				items: [],
			});

			// `limitReached` is what tells the client to offer an upgrade, since the
			// refused edit never reaches the browser to be counted there.
			expect(result).toEqual({
				ok: false,
				error: expect.stringContaining("Section limit reached"),
				limitReached: true,
			});
		});

		it("keeps the id it was given so the browser mints the same one", () => {
			const s = session();
			s.run({
				op: "add_section",
				id: "sec-fixed",
				sectionType: "category",
				name: "Food",
				items: [{ id: "item-fixed", name: "Toast" }],
			});

			const index = s.working.content.findIndex((b) => b.id === "sec-fixed");
			expect(index).toBeGreaterThanOrEqual(0);
			expect(itemsOf(s.working, index)[0].id).toBe("item-fixed");
		});
	});

	describe("snapshot", () => {
		it("indexes sections and items and marks existing photos", () => {
			const s = session();
			s.run({
				op: "update_item",
				sectionId: "sec-1",
				itemId: "it-1",
				image: "https://example.com/a.jpg",
			});

			const snapshot = s.snapshot();

			expect(snapshot).toContain("SECTIONS (2):");
			expect(snapshot).toContain('[0] category "Drinks"');
			expect(snapshot).toContain('[0] "Espresso" 2.5 [img]');
			expect(snapshot).toContain("[1] text");
			// HTML is stripped so the model reads prose, not markup.
			expect(snapshot).toContain("We roast every Tuesday.");
			expect(snapshot).not.toContain("<p>");
		});

		it("reflects edits made earlier in the same turn", () => {
			const s = session();
			s.run({ op: "delete_section", sectionId: "sec-2" });

			expect(s.snapshot()).toContain("SECTIONS (1):");
		});
	});
});
