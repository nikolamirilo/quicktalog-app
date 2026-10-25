import type { OperationLimits } from "@/lib/catalogue/operations";
import type { AgentMessageMetadata } from "@/types/ai";

type WithMetadata = { metadata?: unknown };

const metadataOf = (message: WithMetadata): Partial<AgentMessageMetadata> =>
	message.metadata && typeof message.metadata === "object"
		? (message.metadata as Partial<AgentMessageMetadata>)
		: {};

/** The limits an agent message's edits were judged by, or null when it carries none. */
export function agentEditLimits(message: WithMetadata): OperationLimits | null {
	const { limits } = metadataOf(message);
	return limits && typeof limits === "object" ? limits : null;
}

export function agentTurnId(message: WithMetadata): string | null {
	const { turnId } = metadataOf(message);
	return typeof turnId === "string" ? turnId : null;
}
