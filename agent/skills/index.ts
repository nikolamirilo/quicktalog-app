import { authenticWriting } from "@/agent/skills/authentic-writing";
import { responsiveDesign } from "@/agent/skills/responsive-design";
import type { Skill, SkillContext } from "@/agent/skills/types";

/** Add new skills here. */
export const SKILLS: Skill[] = [authenticWriting, responsiveDesign];

export const activeSkills = (context: SkillContext): Skill[] =>
	SKILLS.filter((skill) => skill.applies(context));

export const findSkill = (name: string): Skill | undefined =>
	SKILLS.find((skill) => skill.name === name);

export const renderAlwaysOn = (context: SkillContext): string =>
	activeSkills(context)
		.filter((skill) => skill.load === "always")
		.map((skill) => skill.content)
		.join("\n\n");

/** Names and when to reach for them, but not the content. */
export const renderIndex = (context: SkillContext): string => {
	const onDemand = activeSkills(context).filter(
		(skill) => skill.load === "on-demand",
	);
	if (onDemand.length === 0) return "";

	const entries = onDemand
		.map(
			(skill) =>
				`- ${skill.name}: ${skill.description} Load this when ${skill.when}.`,
		)
		.join("\n");

	return `SKILLS:
Extra guidance you can read when you need it. Call loadSkill with the name to get the full rules, then follow them. Load a skill before doing the work it covers, not after, and note that some tools refuse to run until you have.
${entries}`;
};

/** A loadSkill result stays in history, so later turns must not reload it. */
export function loadedSkillsFromMessages(messages: unknown[]): string[] {
	const loaded = new Set<string>();

	for (const message of messages ?? []) {
		const parts = (message as { parts?: unknown[] })?.parts;
		if (!Array.isArray(parts)) continue;

		for (const part of parts) {
			const typed = part as {
				type?: string;
				state?: string;
				input?: { name?: string };
			};
			if (typed?.type !== "tool-loadSkill") continue;
			if (typed.state !== "output-available") continue;
			if (typed.input?.name) loaded.add(typed.input.name);
		}
	}

	return [...loaded];
}

export type { Skill, SkillContext, SkillGateCall } from "@/agent/skills/types";
