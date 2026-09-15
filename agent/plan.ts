import { z } from "zod";

/**
 * A multi-part request, broken into tasks the agent works one after another.
 *
 * The point is the 60-second function ceiling on `/api/agent`. One request
 * cannot finish "add a drinks menu, translate everything, restyle it and embed
 * our map", and being killed halfway leaves the draft in a state nobody can
 * describe. So the agent writes the list down first, works what fits in its
 * budget, and the browser sends it back for another go until the list is done.
 *
 * The plan is never stored server-side. It rides in the message history as the
 * output of the plan tools and is read back out on the next request, exactly
 * the way `loadedSkillsFromMessages` recovers loaded skills.
 */

/**
 * Opens the turn the builder sends to resume a plan.
 *
 * Three things key off it: the route, which only restores a plan when it sees
 * one; the model, whose instructions explain that this turn is not the user
 * speaking; and the chat bubble, which renders nothing for it so the transcript
 * shows one request rather than nine.
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
	/**
	 * Bumped on every change. The browser compares it across rounds: a round
	 * that moves nothing ends the loop, so a model that stops settling tasks
	 * cannot spin forever.
	 */
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

/**
 * Where the current ask begins: the last thing the user actually typed.
 *
 * Everything after it - the agent's work, and the builder's resume turns -
 * belongs to that ask. Everything before it belongs to an earlier one.
 */
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

/**
 * The plan belonging to the ask in progress, or null if it needed none.
 *
 * Scoped to the current ask rather than the whole transcript, because a plan
 * the user walked away from must not come back: they abandon a half-finished
 * list by simply typing something else, and without this the resume loop would
 * pick the old one back up and carry on editing their catalogue.
 *
 * Within the ask, last in document order wins rather than highest revision -
 * revisions count from one again each time a plan is written.
 */
export function planFromMessages(messages: unknown[]): PlanState | null {
	let newest: PlanState | null = null;

	for (const message of (messages ?? []).slice(currentAskFrom(messages))) {
		const parts = (message as { parts?: unknown[] })?.parts;
		if (!Array.isArray(parts)) continue;

		for (const part of parts) {
			const typed = part as {
				type?: string;
				state?: string;
				output?: { plan?: unknown };
			};
			if (!typed?.type || !PLAN_TOOL_PARTS.has(typed.type)) continue;
			if (typed.state !== "output-available") continue;

			const parsed = planStateSchema.safeParse(typed.output?.plan);
			// Rebuilt field by field rather than taken as-is: `strict` is off in
			// this project, so zod's inferred output does not line up with
			// `PlanState`, and anything else the part carried is dropped here.
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
	}

	return newest;
}

/** Is this request the builder resuming a plan rather than the user asking? */
export function isPlanContinuation(messages: unknown[]): boolean {
	const last = (messages ?? [])[messages.length - 1] as
		| { role?: string }
		| undefined;
	if (last?.role !== "user") return false;
	return textParts(last).some((text) => text.trim() === CONTINUE_PLAN_MARKER);
}

/**
 * How many times the builder will resume a plan on its own.
 *
 * Twelve tasks at a couple per request is the worst realistic case, so eight is
 * headroom rather than a target. It is the backstop for a case the checks below
 * miss: without a hard stop, a loop that never settles anything would bill the
 * user for requests they did not ask for.
 */
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

/**
 * What the builder should do now that a round has finished.
 *
 * Kept away from React because it is the part that must not be wrong: every
 * path that is not "resume" has to be reachable, or an agent having a bad day
 * turns into an unbounded run of requests the user pays for.
 */
export function resumeDecision(state: ResumeState): ResumeDecision {
	const { plan, failed, continuations, lastRevision } = state;

	// No plan, or every task settled: the request is finished either way.
	if (!plan || isPlanFinished(plan)) return { action: "wait" };

	// Whatever broke is unlikely to fix itself on a retry, and the checklist is
	// left showing exactly how far the plan got.
	if (failed) return { action: "halt", halt: "failed" };

	// Nothing moved since the last round. Either the model stopped settling
	// tasks, or every task left keeps failing; sending the same request again
	// would only charge the user to watch it happen twice.
	if (plan.revision === lastRevision)
		return { action: "halt", halt: "stalled" };

	if (continuations >= MAX_PLAN_CONTINUATIONS) {
		return { action: "halt", halt: "exhausted" };
	}

	return { action: "resume" };
}
