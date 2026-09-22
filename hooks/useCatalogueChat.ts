"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import {
	CONTINUE_PLAN_MARKER,
	type PlanHalt,
	type PlanState,
	planFromMessages,
	resumeDecision,
} from "@/agent/plan";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { getRequiredPlan } from "@/helpers/client";
import { useChatImageOcr } from "@/hooks/useChatImageOcr";
import type { AgentToolResult } from "@/types/ai";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

/** Failed responses arrive with the route's JSON body as the error message. */
function parseErrorCode(error: Error): string | undefined {
	try {
		return JSON.parse(error.message)?.code;
	} catch {
		return undefined;
	}
}

/** Extract a user-facing message: auth/quota errors are `{ error, code }` JSON, stream errors are plain strings. */
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
 * Drives the builder's AI agent. Tool parts stream back with id-addressed
 * edits, replayed live against the builder draft as the agent works - so
 * hand-made edits mid-turn aren't clobbered. Attached images are scanned in
 * the browser and ride along as a second text part.
 *
 * A multi-part request comes back as a plan (a to-do list ticked off as it
 * works); the server stops each request before its function times out, so
 * finishing the list takes several requests - sending those is this hook's
 * job (the loop below), guarded against a confused model looping forever.
 *
 * Nothing is persisted here: the user still saves/publishes normally.
 */
export function useCatalogueChat() {
	const context = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();
	// Catalogue language is already a Tesseract code, chosen at creation.
	const attachments = useChatImageOcr(context?.catalogue?.language);
	const [showAiLimits, setShowAiLimits] = useState(false);
	const [contentLimitHit, setContentLimitHit] = useState(false);

	// Tool parts re-render on every stream chunk; keeps an edit from applying twice as its part settles.
	const appliedCalls = useRef(new Set<string>());

	// Resume-loop state as refs: shouldn't re-render the panel, and the
	// continuation effect must read values it just wrote on the next pass.
	const continuations = useRef(0);
	const lastRevision = useRef(-1);
	const abandoned = useRef(false);
	/** Id of the last message the loop already ruled on - guards against firing twice while `status` is momentarily stale. */
	const settledFor = useRef<string | null>(null);
	const [planHalt, setPlanHalt] = useState<PlanHalt | null>(null);

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
			// The client gate below catches most; the server's check is authoritative.
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
				// Plan-ceiling refusals never reach the draft; this is the only signal left to offer an upgrade.
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

	/** The list the agent is working, wherever in the transcript it last moved. */
	const plan: PlanState | null = useMemo(
		() => planFromMessages(messages),
		[messages],
	);

	/** The turn charged for this ask; continuations resend it so a multi-request plan is one charge, not several. */
	const rootTurnId: string | null = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			const message = messages[i];
			if (message.role !== "assistant") continue;
			const id = (message as { metadata?: { turnId?: string | null } }).metadata
				?.turnId;
			if (id) return id;
		}
		return null;
	}, [messages]);
	// Un-pauses an unfinished plan: sends the whole history plus the live draft
	// (already carrying this round's edits), which is how the next request knows
	// what was done without server-side storage. `resumeDecision` holds the policy.
	useEffect(() => {
		if (status !== "ready") return;
		if (abandoned.current || !context?.catalogue?.name) return;

		// Only act on a finished round (ends with the agent speaking); a trailing
		// user message is either the fresh ask or this effect's own resume turn.
		const last = messages[messages.length - 1];
		if (!last || last.role === "user") return;
		if (settledFor.current === last.id) return;
		const lastId = last.id;

		const decision = resumeDecision({
			plan,
			failed: Boolean(error),
			continuations: continuations.current,
			lastRevision: lastRevision.current,
		});
		if (decision.action === "wait") return;

		settledFor.current = lastId;
		if (decision.action === "halt") {
			setPlanHalt(decision.halt);
			return;
		}

		lastRevision.current = (plan as PlanState).revision;
		continuations.current += 1;
		void sendMessage(
			{ parts: [{ type: "text", text: CONTINUE_PLAN_MARKER }] },
			{
				body: {
					catalogueName: context.catalogue.name,
					catalogue: context.catalogue,
					continuationOf: rootTurnId,
				},
			},
		);
	}, [status, plan, error, context, messages, sendMessage, rootTurnId]);

	// Refresh usage after a turn finishes (not on mount, where status is also "ready").
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

		clearError(); // a leftover error from the last ask would read as this one failing

		// A new ask starts a new plan, so the loop starts over.
		continuations.current = 0;
		lastRevision.current = -1;
		settledFor.current = null;
		abandoned.current = false;
		setPlanHalt(null);

		// A second text part, not one concatenated string, so the bubble can collapse the scan on its own.
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
		attachments.clear(); // the scan is in history now; keeping thumbnails would resend it
	};

	const reset = () => {
		stop();
		setMessages([]);
		clearError();
		appliedCalls.current.clear();
		attachments.clear();
		abandoned.current = true; // must stop the plan too, not just the in-flight request
		continuations.current = 0;
		lastRevision.current = -1;
		settledFor.current = null;
		setPlanHalt(null);
	};

	return {
		messages,
		send,
		reset,
		attachments,
		loading,
		plan,
		planHalt,
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
