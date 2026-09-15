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
 * A request with several things in it comes back as a plan: a to-do list the
 * agent writes before it starts, ticked off as it works. The server stops each
 * request before the function times out, so finishing the list takes more than
 * one - and sending those follow-up requests is this hook's job. The loop below
 * is what makes "add a drinks menu, translate it and restyle it" finish at all,
 * and the two guards on it are what keep a confused model from looping forever.
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

	// Resume-loop state. Refs rather than state: nothing here should re-render
	// the panel, and the continuation effect has to read the values it just
	// wrote on the very next pass.
	const continuations = useRef(0);
	const lastRevision = useRef(-1);
	const abandoned = useRef(false);
	/**
	 * Id of the last message the loop has already ruled on.
	 *
	 * The effect re-runs on anything that touches the draft, and for a moment
	 * after a round ends the status is still "ready" - so without this it would
	 * either fire twice or read its own dispatch as a round that changed nothing.
	 */
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

	/** The list the agent is working, wherever in the transcript it last moved. */
	const plan: PlanState | null = useMemo(
		() => planFromMessages(messages),
		[messages],
	);
	// Send the next request of an unfinished plan.
	//
	// The server stops each request short of the function timeout, so a plan with
	// tasks left is not a failure - it is a pause, and this is what un-pauses it.
	// The whole history goes back with it, and so does the live draft, which has
	// already had this round's edits replayed into it: that is how the next
	// request knows what was done without anything being stored server-side.
	//
	// `resumeDecision` holds the policy; this only carries it out.
	useEffect(() => {
		if (status !== "ready") return;
		if (abandoned.current || !context?.catalogue?.name) return;

		// Only ever act on a finished round, which always ends with the agent
		// speaking. A user message on top means either the ask that was just
		// submitted or the resume turn this effect itself wrote a moment ago -
		// reading that as a round would call a fresh dispatch a stalled one.
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
				},
			},
		);
	}, [status, plan, error, context, messages, sendMessage]);

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

		// An error left over from the last ask would read as this one failing.
		clearError();

		// A new ask starts a new plan, so the loop starts over with it.
		continuations.current = 0;
		lastRevision.current = -1;
		settledFor.current = null;
		abandoned.current = false;
		setPlanHalt(null);

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
		// Clearing the conversation has to stop the plan too, not just the request
		// in flight - otherwise the next round fires into an empty transcript.
		abandoned.current = true;
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
