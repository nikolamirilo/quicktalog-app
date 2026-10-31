import { buildInstructions } from "@/agent/core/instructions";
import {
	AGENT_REASONING,
	AGENT_TEMPERATURE,
	MAX_AGENT_STEPS,
	modelFor,
} from "@/agent/core/model";
import type { CatalogueSession } from "@/agent/core/session";
import { buildTools } from "@/agent/tools";
import { type InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";

/** Per request: the tools close over the session, so a singleton would leak catalogues. */
export function createCatalogueAgent(session: CatalogueSession) {
	return new ToolLoopAgent({
		model: modelFor(session.aiLimits.proModel),
		instructions: buildInstructions(session),
		tools: buildTools(session),
		reasoning: AGENT_REASONING,
		temperature: AGENT_TEMPERATURE,
		// Two ceilings, whichever comes first: step count, and the clock (`outOfTime`)
		// that lets a plan span requests via the browser's resume loop.
		stopWhen: [stepCountIs(MAX_AGENT_STEPS), () => session.outOfTime()],
		prepareStep: () => creditStep(session),
	});
}

/** Once a billable step was refused, the model gets one text-only step to tell the user, then the loop ends. */
export function creditStep(
	session: CatalogueSession,
): { toolChoice: "none" } | undefined {
	return session.credits.exhausted ? { toolChoice: "none" } : undefined;
}

type CatalogueAgent = ReturnType<typeof createCatalogueAgent>;

export type CatalogueAgentUIMessage = InferAgentUIMessage<CatalogueAgent>;

export { CatalogueSession } from "@/agent/core/session";
