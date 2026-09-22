import type { CatalogueSession } from "@/agent/session";
import { appearanceTools } from "@/agent/tools/appearance";
import { buildContext } from "@/agent/tools/context";
import { generalTools } from "@/agent/tools/general";
import { itemTools } from "@/agent/tools/items";
import { navigationTools } from "@/agent/tools/navigation";
import { planningTools } from "@/agent/tools/planning";
import { researchTools } from "@/agent/tools/research";
import { sectionTools } from "@/agent/tools/sections";
import { skillTools } from "@/agent/tools/skills";
import { type JSONValue } from "ai";

/**
 * Every tool the agent can call, grouped by the builder tab it edits. Spread
 * as object literals (not built via `Object.fromEntries`) to keep the keys
 * literal, so `AgentToolName` stays exact and `display.ts`'s
 * `Record<AgentToolName, ...>` can catch a tool with no label.
 */
export function buildTools(session: CatalogueSession) {
	const context = buildContext(session);

	const tools = {
		...planningTools(context),
		...skillTools(context),
		...researchTools(context),
		...sectionTools(context),
		...itemTools(context),
		...appearanceTools(context),
		...generalTools(context),
		...navigationTools(context),
	};

	return hideOperations(gateCalls(session, tools));
}

export type AgentTools = ReturnType<typeof buildTools>;
export type AgentToolName = keyof AgentTools;

/** Central so a new gate needs no change here, and no tool escapes one. */
function gateCalls<T extends Record<string, { execute?: unknown }>>(
	session: CatalogueSession,
	tools: T,
): T {
	for (const [name, definition] of Object.entries(tools)) {
		if (name === "loadSkill") continue;
		const run = definition.execute as (
			input: Record<string, unknown>,
			options: unknown,
		) => unknown;

		definition.execute = async (
			input: Record<string, unknown>,
			options: unknown,
		) => session.requireSkills({ tool: name, input }) ?? run(input, options);
	}
	return tools;
}

/**
 * The model reads every result except `operation` - the client needs it to
 * replay an edit, but echoing it back (ids, image URLs, ...) would get
 * re-read on every later step and turn for no benefit to the model.
 */
function hideOperations<T extends Record<string, object>>(tools: T): T {
	for (const definition of Object.values(tools)) {
		(definition as { toModelOutput?: unknown }).toModelOutput = ({
			output,
		}: {
			output: unknown;
		}) => {
			const { operation: _, ...rest } = (output ?? {}) as Record<
				string,
				unknown
			>;
			return { type: "json", value: rest as JSONValue };
		};
	}
	return tools;
}
