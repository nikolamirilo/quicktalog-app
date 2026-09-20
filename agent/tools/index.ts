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
 * Every tool the agent can call, grouped by the builder tab it edits.
 *
 * Spreading object literals is what keeps the keys literal, so `AgentToolName`
 * stays an exact union of the tools that exist - which is what makes the
 * `Record<AgentToolName, ...>` in `display.ts` catch a tool nobody gave a
 * label. Building the set from an array with `Object.fromEntries` collapses it
 * to `Record<string, Tool>` and silently loses that; don't.
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
 * The model reads every result except `operation`.
 *
 * The client needs the operation to replay an edit; the model only needs to
 * know it landed. Echoed back, 40 items with their ids and image URLs would be
 * re-read on every later step and every later turn.
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
