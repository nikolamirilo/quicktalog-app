import { CatalogueSession, createCatalogueAgent } from "@/agent";
import { isPlanContinuation, planFromMessages } from "@/agent/plan";
import { loadedSkillsFromMessages } from "@/agent/skills";
import { authorize, meter } from "@/lib/ai/access";
import type { Catalogue } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { APICallError, createAgentUIStreamResponse } from "ai";

export const maxDuration = 60;

/** Server-side ceiling for a single turn. Sits comfortably under `maxDuration`
 *  so a hung DeepSeek stream surfaces as a clean timeout error to the client
 *  instead of being killed at the platform edge.
 *
 *  It has to sit above `TURN_BUDGET_MS` in `agent/session.ts`, which is where a
 *  turn is meant to stop: the agent decides to stop at 38s, the step already
 *  running has until 50s to finish and flush, and the platform kills the
 *  function at 60s. Lower this below the budget and every long turn ends as a
 *  timeout error instead of as a paused plan. */
const AGENT_TIMEOUT_MS = 50_000;

const ERROR_STATUS: Record<string, number> = {
	unauthorized: 401,
	not_found: 404,
	limit: 429,
	ai_error: 500,
};

interface AgentRequestBody {
	messages: unknown[];
	catalogueName: string;
	/** The live builder draft, so unsaved edits are part of the context. */
	catalogue: Catalogue;
}

export async function POST(request: Request) {
	let body: AgentRequestBody;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Malformed request." }, { status: 400 });
	}

	const { messages, catalogueName, catalogue } = body;
	if (!catalogueName || !catalogue) {
		return Response.json(
			{ error: "Catalogue is still loading. Try again." },
			{ status: 400 },
		);
	}

	const auth = await authorize(catalogueName);
	if (auth.ok === false) {
		return Response.json(
			{ error: auth.error, code: auth.code },
			{ status: ERROR_STATUS[auth.code] ?? 500 },
		);
	}

	// A plan is only picked back up when the browser is explicitly resuming one.
	// On a fresh message from the user the plan stays null, so the agent is free
	// to write a new list rather than being told it already has one.
	const resuming = isPlanContinuation(messages);
	const plan = resuming ? planFromMessages(messages) : null;

	const session = new CatalogueSession(
		catalogue,
		auth.limits,
		auth.sectionAccess,
		// A skill loaded on an earlier turn is still in the message history, so
		// the model can see it without being made to fetch it again.
		loadedSkillsFromMessages(messages),
		auth.userId,
		plan,
	);

	// Combine the client-side abort (user clicks "Clear conversation") with a
	// server-side ceiling so a hung DeepSeek stream fails fast instead of
	// burning the full function budget.
	const signal = AbortSignal.any([
		request.signal,
		AbortSignal.timeout(AGENT_TIMEOUT_MS),
	]);

	return createAgentUIStreamResponse({
		agent: createCatalogueAgent(session),
		uiMessages: messages,
		abortSignal: signal,
		onError: (error) => {
			Sentry.captureException(error, { tags: { op: "catalogueAgent" } });
			console.error("Catalogue agent failed:", error);

			if (APICallError.isInstance(error)) {
				return "The AI service powering the assistant is having trouble responding right now. Please try again in a moment.";
			}
			if (
				error instanceof Error &&
				(error.name === "AbortError" || error.name === "TimeoutError")
			) {
				return "The assistant took too long to respond. Please try again.";
			}

			return "Something went wrong while making those changes. Try again.";
		},
		onFinish: async () => {
			// Charge the quota only when the turn actually changed something, so a
			// question - or a turn where every edit was rejected - stays free.
			if (session.applied.length === 0) return;
			// One ask from the user is one prompt, however many requests it takes
			// to work through its plan. Only the request the user actually sent is
			// charged; the ones the builder sends to resume are not.
			//
			// This trusts the history, which is client-supplied - the airtight
			// version is a ledger keyed on a turn id with a unique index, which is
			// the credits work in docs/ai-agent-plan-mode.md.
			if (plan) return;
			try {
				await meter(auth.userId, catalogueName);
			} catch (error) {
				Sentry.captureException(error, { tags: { op: "catalogueAgentMeter" } });
			}
		},
	});
}
