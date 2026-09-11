import { CatalogueSession } from "@/agent/session";
import {
	activeSkills,
	loadedSkillsFromMessages,
	renderAlwaysOn,
	renderIndex,
	SKILLS,
} from "@/agent/skills";
import type { AiSectionAccess, AiSectionType } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const names = (types: AiSectionType[]) =>
	activeSkills({ sectionTypes: types }).map((skill) => skill.name);

const FREE_PLAN: AiSectionType[] = ["category", "container", "text"];
const PAID_PLAN: AiSectionType[] = [...FREE_PLAN, "embedding", "custom_code"];

const NO_CODE: AiSectionAccess = {
	divider: true,
	embedding: false,
	customCode: false,
};

const catalogue = { ...defaultCatalogueData, name: "cafe" } as Catalogue;
const session = (access?: AiSectionAccess, loaded: string[] = []) =>
	new CatalogueSession(catalogue, {}, access, loaded);

const WIDGET = { tool: "addSection", input: { code: "<div>hi</div>" } };

describe("agent skills", () => {
	describe("plan gating", () => {
		it("always offers the writing rules", () => {
			expect(names(FREE_PLAN)).toContain("authentic-writing");
			expect(names(PAID_PLAN)).toContain("authentic-writing");
		});

		it("drops responsive guidance when no code section is unlocked", () => {
			expect(names(FREE_PLAN)).not.toContain("responsive-design");
		});
	});

	describe("prompt rendering", () => {
		it("inlines style skills and only indexes on-demand ones", () => {
			const inlined = renderAlwaysOn({ sectionTypes: PAID_PLAN });
			const index = renderIndex({ sectionTypes: PAID_PLAN });

			expect(inlined).toContain("WRITING:");
			// The whole point: the body stays out of the prompt until asked for.
			expect(inlined).not.toContain("RESPONSIVE DESIGN:");
			expect(index).toContain("responsive-design:");
			expect(index).not.toContain("RESPONSIVE DESIGN:");
		});

		it("gives every indexed skill a trigger, not just a topic", () => {
			const index = renderIndex({ sectionTypes: PAID_PLAN });

			for (const skill of SKILLS) {
				if (skill.load !== "on-demand") continue;
				expect(skill.when.trim()).not.toBe("");
				expect(index).toContain(`Load this when ${skill.when}.`);
			}
		});

		it("renders no index when the plan unlocks no on-demand skill", () => {
			expect(renderIndex({ sectionTypes: FREE_PLAN })).toBe("");
		});

		it("uses no em or en dashes in any skill sent to the model", () => {
			for (const skill of SKILLS) {
				expect(skill.content).not.toMatch(/[-–]/);
			}
		});
	});

	describe("loadSkill", () => {
		it("returns the content and unlocks the gated call", () => {
			const s = session();
			expect(s.requireSkills(WIDGET)).not.toBeNull();

			const loaded = s.loadSkill("responsive-design");

			expect(loaded).toEqual({
				skill: "responsive-design",
				content: expect.stringContaining("RESPONSIVE DESIGN:"),
			});
			expect(s.requireSkills(WIDGET)).toBeNull();
		});

		it("lists the real options when asked for something that is not a skill", () => {
			const result = session().loadSkill("responsive-designs");

			expect((result as { error: string }).error).toContain(
				"responsive-design",
			);
		});

		it("refuses a skill the caller's plan does not unlock", () => {
			const result = session(NO_CODE).loadSkill("responsive-design");

			expect(result).toHaveProperty("error");
		});
	});

	describe("the gate", () => {
		it("blocks a code write until the skill is read", () => {
			const blocked = session().requireSkills(WIDGET);

			expect(blocked).toEqual({
				ok: false,
				error: expect.stringContaining("responsive-design"),
			});
		});

		it("leaves calls that write no code alone", () => {
			const s = session();

			expect(
				s.requireSkills({ tool: "addSection", input: { name: "Drinks" } }),
			).toBeNull();
			expect(
				s.requireSkills({ tool: "updateItem", input: { price: 3 } }),
			).toBeNull();
		});

		it("does not gate a plan that cannot write code anyway", () => {
			expect(session(NO_CODE).requireSkills(WIDGET)).toBeNull();
		});

		it("stays satisfied by a skill loaded on an earlier turn", () => {
			expect(
				session(undefined, ["responsive-design"]).requireSkills(WIDGET),
			).toBeNull();
		});
	});

	describe("loadedSkillsFromMessages", () => {
		it("recovers skills loaded earlier in the conversation", () => {
			const messages = [
				{ role: "user", parts: [{ type: "text", text: "build a widget" }] },
				{
					role: "assistant",
					parts: [
						{
							type: "tool-loadSkill",
							state: "output-available",
							input: { name: "responsive-design" },
						},
						{ type: "tool-addSection", state: "output-available", input: {} },
					],
				},
			];

			expect(loadedSkillsFromMessages(messages)).toEqual(["responsive-design"]);
		});

		it("ignores a call that never produced a result, and odd shapes", () => {
			expect(
				loadedSkillsFromMessages([
					{
						role: "assistant",
						parts: [
							{
								type: "tool-loadSkill",
								state: "input-streaming",
								input: { name: "responsive-design" },
							},
						],
					},
					{ role: "user" },
					null,
				]),
			).toEqual([]);
		});
	});
});
