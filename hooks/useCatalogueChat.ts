"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { getRequiredPlan } from "@/helpers/client";
import type { AgentToolResult } from "@/types/ai";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useEffect, useRef, useState } from "react";

/** Failed responses arrive with the route's JSON body as the error message. */
function parseErrorCode(error: Error): string | undefined {
	try {
		return JSON.parse(error.message)?.code;
	} catch {
		return undefined;
	}
}

/**
 * Drives the builder's AI agent.
 *
 * The agent streams its work back as tool parts. Each one that resolves carries
 * the edit it made to the server's working copy, which is replayed here against
 * the live builder draft - so the catalogue fills in as the agent works rather
 * than all at once at the end. Operations are id-addressed, so edits the user
 * makes by hand mid-turn are not clobbered.
 *
 * Nothing is persisted: the user still saves or publishes with the normal
 * builder actions.
 */
export function useCatalogueChat() {
	const context = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();
	const [showAiLimits, setShowAiLimits] = useState(false);
	const [contentLimitHit, setContentLimitHit] = useState(false);

	// Tool parts re-render on every stream chunk; this keeps an edit from being
	// applied twice as its part settles.
	const appliedCalls = useRef(new Set<string>());

	const {
		messages,
		sendMessage,
		status,
		error,
		setMessages,
		stop,
		clearError,
	} = useChat<CatalogueAgentUIMessage>({
		transport: new DefaultChatTransport({ api: "/api/agent" }),
		onError: (err) => {
			// The client gate below catches most of these, but the server's check
			// is the authoritative one and arrives as a failed response body.
			if (parseErrorCode(err) === "limit") setShowAiLimits(true);
		},
	});

	const loading = status === "submitted" || status === "streaming";

	useEffect(() => {
		for (const message of messages) {
			if (message.role !== "assistant") continue;

			for (const part of message.parts) {
				if (!isToolUIPart(part)) continue;
				if (part.state !== "output-available") continue;
				if (appliedCalls.current.has(part.toolCallId)) continue;

				const output = part.output as Partial<AgentToolResult> | undefined;
				if (!output) continue;

				appliedCalls.current.add(part.toolCallId);
				// The agent enforces plan ceilings on the server, so an edit refused
				// for that reason never reaches the draft. This is the only signal
				// left that the user should be offered an upgrade.
				if (output.ok === false) {
					if (output.limitReached) setContentLimitHit(true);
					continue;
				}
				// Reading tools carry no edit to replay.
				if (!output.operation) continue;
				context?.applyOperations([output.operation]);
			}
		}
	}, [messages, context]);

	// Usage is metered server-side once the turn finishes; refresh so the limit
	// modal and the dashboard counter stay accurate. `status` is "ready" on mount
	// too, so only refresh once a turn has actually run.
	const hasRun = useRef(false);
	useEffect(() => {
		if (loading) hasRun.current = true;
		if (status === "ready" && hasRun.current) {
			hasRun.current = false;
			void refreshUserData();
		}
	}, [status, loading, refreshUserData]);

	const isOverLimit = (): boolean => {
		const limit = userData?.currentPlan?.features?.ai_prompts;
		const used = userData?.usage?.prompts ?? 0;
		return typeof limit === "number" && used >= limit;
	};

	const send = (input: string) => {
		const text = input.trim();
		if (!text || loading || !context?.catalogue?.name) return;
		if (isOverLimit()) {
			setShowAiLimits(true);
			return;
		}

		void sendMessage(
			{ text },
			{
				body: {
					catalogueName: context.catalogue.name,
					catalogue: context.catalogue,
				},
			},
		);
	};

	const reset = () => {
		stop();
		setMessages([]);
		clearError();
		appliedCalls.current.clear();
	};

	return {
		messages,
		send,
		reset,
		loading,
		error,
		showAiLimits,
		setShowAiLimits,
		currentPlan: userData?.currentPlan,
		requiredPlan: userData?.currentPlan
			? getRequiredPlan(userData.currentPlan, "ai")
			: undefined,
		contentLimitHit,
		setContentLimitHit,
	};
}
