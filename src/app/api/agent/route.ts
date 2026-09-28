import { CatalogueSession, createCatalogueAgent } from "@/agent";
import {
	fetchesFromMessages,
	isPlanContinuation,
	isPlanFinished,
	planFromMessages,
} from "@/agent/plan";
import { loadedSkillsFromMessages } from "@/agent/skills";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { sameOrigin } from "@/lib/http/origin";
import {
	aiRateLimitOk,
	refundAiTurn,
	setPlanState,
	settleAiTurn,
} from "@/lib/ai/metering";
import { CREDITS } from "@/lib/ai/pricing";
import { openAiTurn } from "@/lib/ai/turn";
import { withUser } from "@/utils/db";
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
	unverified: 403,
	limit: 429,
	rate_limited: 429,
	ai_error: 500,
};

interface AgentRequestBody {
	messages: unknown[];
	catalogueName: string;
	/** The live builder draft, so unsaved edits are part of the context. */
	catalogue: Catalogue;
	/**
	 * The turn this request continues, as sent to the browser in the previous
	 * turn's message metadata. Absent or wrong means this is charged as a new
	 * turn, which is the safe direction.
	 */
	continuationOf?: string | null;
}

export async function POST(request: Request) {
	let body: AgentRequestBody;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Malformed request." }, { status: 400 });
	}

	const { messages, catalogueName, catalogue, continuationOf } = body;
	if (!catalogueName || !catalogue) {
		return Response.json(
			{ error: "Catalogue is still loading. Try again." },
			{ status: 400 },
		);
	}
	// The draft in the body is only context; it must be the catalogue the
	// request claims to be about.
	if (catalogue.name !== catalogueName) {
		return Response.json({ error: "Catalogue mismatch." }, { status: 400 });
	}

	// Cookie-authenticated and it spends money, so the request must come from
	// our own pages, not merely be same-site.
	if (!sameOrigin(request)) {
		return Response.json({ error: "Bad origin." }, { status: 403 });
	}

	// Identity and payment happen before a single token is streamed.
	const me = await getVerifiedIdentity();
	if (!me) {
		return Response.json(
			{ error: "You must be signed in.", code: "unauthorized" },
			{ status: 401 },
		);
	}

	// Ahead of the ledger, so a script cannot spend a month of credits in seconds.
	if (!(await aiRateLimitOk(me.userId))) {
		return Response.json(
			{ error: "Too many requests. Give it a moment.", code: "rate_limited" },
			{ status: 429 },
		);
	}

	// A plan is only picked back up when the browser is explicitly resuming one.
	// On a fresh message from the user the plan stays null, so the agent is free
	// to write a new list rather than being told it already has one.
	const resuming = isPlanContinuation(messages);
	const plan = resuming ? planFromMessages(messages) : null;

	const turn = await openAiTurn(me, {
		catalogue: catalogueName,
		kind: "agent",
		continuationOf: resuming ? (continuationOf ?? null) : null,
		plan,
	});
	if (turn.ok === false) {
		return Response.json(
			{ error: turn.error, code: turn.code },
			{ status: ERROR_STATUS[turn.code] ?? 500 },
		);
	}
	// For a continuation the database returns the root turn, so a plan spanning
	// several requests stays one charge.
	const rootTurnId = turn.turnId;

	const session = new CatalogueSession(
		catalogue,
		turn.limits,
		turn.sectionAccess,
		// A skill loaded on an earlier turn is still in the message history, so
		// the model can see it without being made to fetch it again.
		loadedSkillsFromMessages(messages),
		me.userId,
		plan,
		// The session is per request but the fetch budget is per ask, or a plan
		// spanning five requests would get three pages each.
		fetchesFromMessages(messages),
		turn.ai,
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
		messageMetadata: () => ({ turnId: rootTurnId }),
		onFinish: async () => {
			if (!rootTurnId) return;
			try {
				await withUser(me, async (tx) => {
					// Record whether the turn left work unfinished: that is what buys
					// the next request its free continuations.
					const unfinished = session.plan && !isPlanFinished(session.plan);
					await setPlanState(tx, rootTurnId, unfinished ? session.plan : null);

					// A turn that changed nothing and opened no plan is refunded. The
					// charge was taken up front, so this is the only place a question
					// or a fully rejected turn becomes free again.
					if (turn.charged && session.applied.length === 0 && !unfinished) {
						await refundAiTurn(tx, rootTurnId);
						return;
					}

					// The base was charged up front; this adds what the turn turned out
					// to cost. The base covers the turn's first task, so only the
					// request that took the charge discounts one - a continuation
					// settles onto the same root turn and every task on it is extra.
					const tasks = session.tasksSettledThisRequest;
					const extra =
						(turn.charged ? Math.max(0, tasks - 1) : tasks) *
							CREDITS.perExtraTask +
						session.fetchesThisRequest * CREDITS.perPageFetch;
					await settleAiTurn(tx, rootTurnId, extra);
				});
			} catch (error) {
				Sentry.captureException(error, { tags: { op: "catalogueAgentMeter" } });
			}
		},
	});
}
