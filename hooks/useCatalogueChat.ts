"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { getRequiredPlan } from "@/helpers/client";
import { useChatImageOcr } from "@/hooks/useChatImageOcr";
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

/** Extract a user-facing message from an error. Auth/quota errors arrive as a
 *  JSON body of the form `{ error, code }`; stream errors arrive as the plain
 *  string returned by the route's `onError`. Falls back to the raw message. */
function parseErrorMessage(error: Error | undefined): string | undefined {
	if (!error?.message) return undefined;
	try {
		const parsed = JSON.parse(error.message);
		return typeof parsed.error === "string" ? parsed.error : error.message;
	} catch {
		return error.message;
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
 * Attached images are scanned in the browser and ride along as a second text
 * part of the user's turn, so the agent works from the words on the photo.
 *
 * Nothing is persisted: the user still saves or publishes with the normal
 * builder actions.
 */
export function useCatalogueChat() {
	const context = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();
	// The catalogue's language is the one Tesseract is asked to read in; it is
	// already a Tesseract code, chosen when the catalogue was created.
	const attachments = useChatImageOcr(context?.catalogue?.language);
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
		if (!text || loading || attachments.scanning) return;
		if (!context?.catalogue?.name) return;
		if (isOverLimit()) {
			setShowAiLimits(true);
			return;
		}

		// A second text part rather than one concatenated string: the bubble can
		// then collapse the scan on its own instead of picking it back apart.
		const scanned = attachments.context;
		void sendMessage(
			{
				parts: scanned
					? [
							{ type: "text", text },
							{ type: "text", text: scanned },
						]
					: [{ type: "text", text }],
			},
			{
				body: {
					catalogueName: context.catalogue.name,
					catalogue: context.catalogue,
				},
			},
		);
		// The scan is in the history now; keeping the thumbnails would send it
		// again on the next turn.
		attachments.clear();
	};

	const reset = () => {
		stop();
		setMessages([]);
		clearError();
		appliedCalls.current.clear();
		attachments.clear();
	};

	return {
		messages,
		send,
		reset,
		attachments,
		loading,
		error,
		errorMessage: parseErrorMessage(error),
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
