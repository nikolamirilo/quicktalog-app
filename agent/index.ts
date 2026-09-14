import { buildInstructions } from "@/agent/instructions";
import {
	AGENT_REASONING,
	AGENT_TEMPERATURE,
	MAX_AGENT_STEPS,
	agentModel,
} from "@/agent/model";
import type { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import { type InferAgentUIMessage, stepCountIs, ToolLoopAgent } from "ai";

/** Per request: the tools close over the session, so a singleton would leak catalogues. */
export function createCatalogueAgent(session: CatalogueSession) {
	return new ToolLoopAgent({
		model: agentModel,
		instructions: buildInstructions(session),
		tools: buildTools(session),
		reasoning: AGENT_REASONING,
		temperature: AGENT_TEMPERATURE,
		stopWhen: stepCountIs(MAX_AGENT_STEPS),
	});
}

type CatalogueAgent = ReturnType<typeof createCatalogueAgent>;

export type CatalogueAgentUIMessage = InferAgentUIMessage<CatalogueAgent>;

export { CatalogueSession } from "@/agent/session";
