import { z } from "zod";

/**
 * A multi-part request, broken into tasks the agent works one after another,
 * to fit the 60s ceiling on `/api/agent`: the agent writes the list down,
 * works what fits, and the browser resends until it's done. Never stored
 * server-side - it rides in the message history like `loadedSkillsFromMessages`.
 */

/**
 * Opens the turn the builder sends to resume a plan. The route restores a plan
 * only when it sees this; the model is told this turn isn't the user speaking;
 * the chat bubble renders nothing for it.
 */
export const CONTINUE_PLAN_MARKER = "[Continue the plan]";

/** Below this it is not a multi-part request, it is one change. */
export const MIN_PLAN_TASKS = 2;
/** Long enough for a menu build, short enough that the list stays readable. */
export const MAX_PLAN_TASKS = 12;
export const MAX_TASK_TITLE_CHARS = 120;
export const MAX_TASK_NOTE_CHARS = 200;

export type PlanTaskStatus = "pending" | "done" | "skipped";

export interface PlanTask {
	/** One short line in the user's language, shown verbatim in the checklist. */
	title: string;
	status: PlanTaskStatus;
	/** What was actually done, or why it could not be. */
	note?: string;
}

export interface PlanState {
	tasks: PlanTask[];
	/** Bumped on every change; a round that moves nothing ends the resume loop. */
	revision: number;
}

/** Plan tools carry no edit to replay, so they are not `AgentToolResult`s. */
export type PlanToolResult =
	| { ok: true; plan: PlanState; remaining: number }
	| { ok: false; error: string };

/** The history is client-supplied, so a restored plan is parsed, not trusted. */
const planStateSchema = z.object({
	tasks: z
		.array(
			z.object({
				title: z.string().trim().min(1).max(MAX_TASK_TITLE_CHARS),
				status: z.enum(["pending", "done", "skipped"]),
				note: z.string().trim().max(MAX_TASK_NOTE_CHARS).optional(),
			}),
		)
		.min(1)
		.max(MAX_PLAN_TASKS),
	revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

const PLAN_TOOL_PARTS = new Set([
	"tool-createPlan",
	"tool-completeTask",
	"tool-skipTask",
]);

export const pendingCount = (plan: PlanState): number =>
	plan.tasks.filter((task) => task.status === "pending").length;

export const isPlanFinished = (plan: PlanState): boolean =>
	pendingCount(plan) === 0;

/** Index of the task being worked now, or -1 when the plan is finished. */
export const activeTaskIndex = (plan: PlanState): number =>
	plan.tasks.findIndex((task) => task.status === "pending");

/** A copy, so every tool result is the snapshot taken when it ran. */
export const clonePlan = (plan: PlanState): PlanState => ({
	tasks: plan.tasks.map((task) => ({ ...task })),
	revision: plan.revision,
});

const textParts = (message: unknown): string[] => {
	const parts = (message as { parts?: unknown[] })?.parts;
	if (!Array.isArray(parts)) return [];
	return parts
		.filter(
			(part): part is { type: "text"; text: string } =>
				(part as { type?: string })?.type === "text" &&
				typeof (part as { text?: unknown })?.text === "string",
		)
		.map((part) => part.text);
};

/** Where the current ask begins: the last thing the user actually typed. */
function currentAskFrom(messages: unknown[]): number {
	for (let index = (messages ?? []).length - 1; index >= 0; index -= 1) {
		const message = messages[index] as { role?: string } | undefined;
		if (message?.role !== "user") continue;
		if (textParts(message).some((text) => text.trim() === CONTINUE_PLAN_MARKER))
			continue;
		return index;
	}
	return 0;
}

/** Every part of every message belonging to the ask in progress - the unit per-ask budgets are counted over. */
export function currentAskParts(messages: unknown[]): unknown[] {
	const parts: unknown[] = [];
	for (const message of (messages ?? []).slice(currentAskFrom(messages))) {
		const own = (message as { parts?: unknown[] })?.parts;
		if (Array.isArray(own)) parts.push(...own);
	}
	return parts;
}

/**
 * The plan belonging to the ask in progress, or null if it needed none. Scoped
 * to the current ask, not the whole transcript, so an abandoned plan can't
 * resurface when the user just types something else. Last in document order
 * wins, not highest revision - revisions restart at each new plan.
 */
export function planFromMessages(messages: unknown[]): PlanState | null {
	let newest: PlanState | null = null;

	for (const part of currentAskParts(messages)) {
		const typed = part as {
			type?: string;
			state?: string;
			output?: { plan?: unknown };
		};
		if (!typed?.type || !PLAN_TOOL_PARTS.has(typed.type)) continue;
		if (typed.state !== "output-available") continue;

		const parsed = planStateSchema.safeParse(typed.output?.plan);
		// Rebuilt field by field: `strict` is off, so zod's output doesn't line up with `PlanState`.
		if (parsed.success) {
			newest = {
				tasks: parsed.data.tasks.map((task) => ({
					title: task.title,
					status: task.status,
					...(task.note ? { note: task.note } : {}),
				})),
				revision: parsed.data.revision,
			};
		}
	}

	return newest;
}

/**
 * Pages already read for this ask. The fetch budget lives on the session,
 * rebuilt per request, so without this a five-request plan would get fetches
 * reset each time. Counts settled calls, matching `allowWebFetch`.
 */
export function fetchesFromMessages(messages: unknown[]): number {
	return currentAskParts(messages).filter((part) => {
		const typed = part as { type?: string; state?: string };
		return (
			typed?.type === "tool-fetchUrl" && typed.state === "output-available"
		);
	}).length;
}

/** Is this request the builder resuming a plan rather than the user asking? */
export function isPlanContinuation(messages: unknown[]): boolean {
	const last = (messages ?? [])[messages.length - 1] as
		| { role?: string }
		| undefined;
	if (last?.role !== "user") return false;
	return textParts(last).some((text) => text.trim() === CONTINUE_PLAN_MARKER);
}

/** Hard cap on auto-resumes; backstop against an unsettling loop billing unwanted requests. */
export const MAX_PLAN_CONTINUATIONS = 8;

/** Why the builder stopped resuming a plan before its list was finished. */
export type PlanHalt = "stalled" | "exhausted" | "failed";

export interface ResumeState {
	/** The newest plan in the transcript, or null if the request needed none. */
	plan: PlanState | null;
	/** The round that just finished ended in an error. */
	failed: boolean;
	/** Rounds the builder has already sent for this plan. */
	continuations: number;
	/** Plan revision when the last round was sent; -1 before the first. */
	lastRevision: number;
}

export type ResumeDecision =
	| { action: "resume" }
	| { action: "halt"; halt: PlanHalt }
	| { action: "wait" };

/** What the builder should do now that a round has finished. Kept out of React since every non-"resume" path must be reachable, or a bad run becomes unbounded. */
export function resumeDecision(state: ResumeState): ResumeDecision {
	const { plan, failed, continuations, lastRevision } = state;

	// No plan, or every task settled: finished either way.
	if (!plan || isPlanFinished(plan)) return { action: "wait" };

	// Unlikely to fix itself on a retry; checklist shows how far it got.
	if (failed) return { action: "halt", halt: "failed" };

	// Nothing moved since the last round - resending would just charge the user twice.
	if (plan.revision === lastRevision)
		return { action: "halt", halt: "stalled" };

	if (continuations >= MAX_PLAN_CONTINUATIONS) {
		return { action: "halt", halt: "exhausted" };
	}

	return { action: "resume" };
}
