import type { ToolContext } from "@/agent/tools/types";
import { tool } from "ai";
import { z } from "zod";

/**
 * Alone in its own file on purpose: `gateCalls` exempts `loadSkill` by name,
 * since gating the tool that loads a skill behind having loaded a skill is a
 * deadlock. Sitting beside other tools invites someone to move it under a gate.
 */
export const skillTools = ({ session }: ToolContext) => ({
	loadSkill: tool({
		description:
			"Read the full rules for one of the skills listed in the prompt. Call this before the work the skill covers, not after.",
		inputSchema: z.object({
			name: z.string().trim().describe("The skill name, exactly as listed."),
		}),
		execute: async ({ name }) => session.loadSkill(name),
	}),
});
