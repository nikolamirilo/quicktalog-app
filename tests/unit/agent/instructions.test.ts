import { SCANNED_TEXT_MARKER } from "@/agent/attachments";
import { buildInstructions } from "@/agent/instructions";
import { CatalogueSession } from "@/agent/session";
import type { AiSectionAccess } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const catalogue = {
	...defaultCatalogueData,
	name: "cafe",
	currency: "EUR",
	language: "en",
	content: [],
} as unknown as Catalogue;

const FREE_PLAN: AiSectionAccess = {
	divider: false,
	embedding: false,
	customCode: false,
};

const prompt = (access?: AiSectionAccess) =>
	buildInstructions(new CatalogueSession(catalogue, {}, access));

describe("buildInstructions", () => {
	it("always sends the role, workflow, content and photo blocks", () => {
		for (const rendered of [prompt(FREE_PLAN), prompt()]) {
			expect(rendered).toContain("You are the AI editor built into Quicktalog");
			expect(rendered).toContain("How you work:");
			expect(rendered).toContain("Content rules:");
			expect(rendered).toContain("Photos:");
		}
	});

	// The rules are useless if they describe a marker the client never sends,
	// so both sides read the constant rather than repeating the string.
	it("names the scanned-text marker the client actually appends", () => {
		expect(prompt()).toContain(SCANNED_TEXT_MARKER);
		expect(prompt()).toContain("Text scanned from uploaded images:");
	});

	// Six rules on writing markup are dead weight for a plan that cannot create
	// a section to put it in, and they contradict the locked-types line.
	it("leaves the code rules out when the plan has no code sections", () => {
		const rendered = prompt(FREE_PLAN);

		expect(rendered).not.toContain("Writing code:");
		expect(rendered).not.toContain("custom_code is the opposite");
		expect(rendered).toContain(
			"cannot use these section types: divider, embedding, custom_code",
		);
	});

	it("sends the code rules once a code section is unlocked", () => {
		expect(prompt()).toContain("Writing code:");
		expect(prompt({ divider: false, customCode: false })).toContain(
			"Writing code:",
		);
	});

	it("keeps every per-catalogue value in the context block, not the rules", () => {
		const rendered = prompt();
		const context = rendered.indexOf("This catalogue:");

		// Everything before the context block has to be byte-identical across
		// callers for the model's prefix cache to survive a catalogue change.
		expect(rendered.slice(0, context)).not.toContain("EUR");
		expect(rendered.slice(context)).toContain("plain numbers in EUR");
		expect(rendered.slice(context)).toContain("user-visible text in en");
	});

	it("ends with the snapshot so the volatile part is last", () => {
		const rendered = prompt();

		expect(rendered.indexOf("CATALOGUE:")).toBeGreaterThan(
			rendered.indexOf("This catalogue:"),
		);
		expect(rendered).toContain(new CatalogueSession(catalogue).snapshot());
	});
});
