import type { AiSectionType } from "@/types/ai";

export interface SkillContext {
	sectionTypes: AiSectionType[];
}

export interface SkillGateCall {
	tool: string;
	input: Record<string, unknown>;
}

interface BaseSkill {
	name: string;
	description: string;
	applies: (context: SkillContext) => boolean;
	content: string;
}

/**
 * `always` is inlined; the agent never has to notice it. Style rules belong
 * here, since it will not stop mid-sentence to fetch one.
 *
 * `on-demand` is indexed by name and fetched with `loadSkill`, so it must say
 * when to reach for it. `requiredFor` turns that from a hint into a gate.
 */
export type Skill =
	| (BaseSkill & { load: "always" })
	| (BaseSkill & {
			load: "on-demand";
			/** The trigger, completing "Load this when ...". */
			when: string;
			requiredFor?: (call: SkillGateCall) => boolean;
	  });
