import {
	activeTaskIndex,
	CONTINUE_PLAN_MARKER,
	isPlanContinuation,
	isPlanFinished,
	MAX_PLAN_CONTINUATIONS,
	MAX_PLAN_TASKS,
	pendingCount,
	resumeDecision,
	type ResumeState,
	type PlanState,
	planFromMessages,
} from "@/agent/plan";
import { CatalogueSession } from "@/agent/session";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { afterEach, describe, expect, it, vi } from "vitest";

const catalogue = { ...defaultCatalogueData, name: "cafe" } as Catalogue;
const session = (plan: PlanState | null = null) =>
	new CatalogueSession(catalogue, {}, undefined, [], "user-1", plan);

/** One settled plan tool part, shaped the way the browser stores it. */
const planPart = (tool: string, plan: unknown) => ({
	type: `tool-${tool}`,
	state: "output-available",
	output: { plan },
});

const state = (
	tasks: Array<[string, PlanState["tasks"][number]["status"]]>,
	revision = 1,
): PlanState => ({
	tasks: tasks.map(([title, status]) => ({ title, status })),
	revision,
});

afterEach(() => {
	vi.useRealTimers();
});

describe("plan", () => {
	describe("turn budget", () => {
		it("keeps going well inside the function budget", () => {
			vi.useFakeTimers();
			const agent = session();
			vi.advanceTimersByTime(20_000);

			expect(agent.outOfTime()).toBe(false);
		});

		it("stops taking new steps before the route aborts the stream", () => {
			// This is what hands the rest of a plan to the next request instead of
			// letting the platform kill the function mid-edit.
			vi.useFakeTimers();
			const agent = session();
			vi.advanceTimersByTime(45_000);

			expect(agent.outOfTime()).toBe(true);
		});
	});

	describe("planFromMessages", () => {
		it("finds nothing in a conversation that never planned", () => {
			expect(
				planFromMessages([
					{
						role: "user",
						parts: [{ type: "text", text: "add a drinks menu" }],
					},
					{ role: "assistant", parts: [{ type: "text", text: "Done." }] },
				]),
			).toBeNull();
		});

		it("rehydrates the plan a tool left in the history", () => {
			const plan = state([
				["Add drinks", "done"],
				["Translate it", "pending"],
			]);
			const restored = planFromMessages([
				{ role: "assistant", parts: [planPart("completeTask", plan)] },
			]);

			expect(restored).toEqual(plan);
			expect(pendingCount(restored as PlanState)).toBe(1);
		});

		it("takes the newest plan, not the highest revision", () => {
			// A second request from the user starts a fresh list whose revision
			// counts from one again; that new list is the current one.
			const restored = planFromMessages([
				{
					role: "assistant",
					parts: [planPart("completeTask", state([["Old", "done"]], 9))],
				},
				{
					role: "assistant",
					parts: [planPart("createPlan", state([["New", "pending"]], 1))],
				},
			]);

			expect(restored?.tasks[0].title).toBe("New");
		});

		it("leaves a plan the user walked away from behind", () => {
			// They abandon a half-finished list by typing something else. Picking
			// it back up would carry on editing a catalogue they moved on from.
			const restored = planFromMessages([
				{ role: "user", parts: [{ type: "text", text: "do four things" }] },
				{
					role: "assistant",
					parts: [planPart("createPlan", state([["Old", "pending"]], 1))],
				},
				{
					role: "user",
					parts: [{ type: "text", text: "never mind, do this" }],
				},
				{ role: "assistant", parts: [{ type: "text", text: "Done." }] },
			]);

			expect(restored).toBeNull();
		});

		it("keeps the plan across the turns that resume it", () => {
			const restored = planFromMessages([
				{ role: "user", parts: [{ type: "text", text: "do four things" }] },
				{
					role: "assistant",
					parts: [planPart("createPlan", state([["One", "pending"]], 1))],
				},
				{ role: "user", parts: [{ type: "text", text: CONTINUE_PLAN_MARKER }] },
				{
					role: "assistant",
					parts: [
						planPart(
							"completeTask",
							state(
								[
									["One", "done"],
									["Two", "pending"],
								],
								2,
							),
						),
					],
				},
			]);

			expect(restored?.revision).toBe(2);
		});

		it("ignores a part that has not settled yet", () => {
			expect(
				planFromMessages([
					{
						role: "assistant",
						parts: [
							{
								type: "tool-createPlan",
								state: "input-available",
								output: { plan: state([["Half-streamed", "pending"]]) },
							},
						],
					},
				]),
			).toBeNull();
		});

		it("drops a malformed plan rather than throwing", () => {
			// The history is client-supplied, so this is parsed, never trusted.
			expect(
				planFromMessages([
					{
						role: "assistant",
						parts: [planPart("createPlan", { tasks: "no" })],
					},
					{ role: "assistant", parts: [planPart("createPlan", null)] },
					{
						role: "assistant",
						parts: [
							planPart("createPlan", {
								tasks: [{ title: "x", status: "invented" }],
								revision: 1,
							}),
						],
					},
				]),
			).toBeNull();
		});

		it("refuses a list longer than the ceiling", () => {
			const tasks: Array<[string, "pending"]> = Array.from(
				{ length: MAX_PLAN_TASKS + 1 },
				(_, index) => [`Task ${index}`, "pending"],
			);
			expect(
				planFromMessages([
					{ role: "assistant", parts: [planPart("createPlan", state(tasks))] },
				]),
			).toBeNull();
		});
	});

	describe("isPlanContinuation", () => {
		const resume = {
			role: "user",
			parts: [{ type: "text", text: CONTINUE_PLAN_MARKER }],
		};

		it("recognises the builder resuming a plan", () => {
			expect(isPlanContinuation([{ role: "user", parts: [] }, resume])).toBe(
				true,
			);
		});

		it("does not fire on a real message from the user", () => {
			expect(
				isPlanContinuation([
					{ role: "user", parts: [{ type: "text", text: "carry on please" }] },
				]),
			).toBe(false);
		});

		it("only looks at the last turn", () => {
			// An earlier resume is history; this request is the user speaking.
			expect(
				isPlanContinuation([
					resume,
					{ role: "user", parts: [{ type: "text", text: "now do this" }] },
				]),
			).toBe(false);
		});

		it("survives an empty history", () => {
			expect(isPlanContinuation([])).toBe(false);
		});
	});

	describe("session plan state", () => {
		it("starts a plan with every task pending", () => {
			const agent = session();
			const result = agent.createPlan(["Add drinks", "Translate it"]);

			expect(result).toMatchObject({ ok: true, remaining: 2 });
			expect(agent.plan?.tasks.map((task) => task.status)).toEqual([
				"pending",
				"pending",
			]);
		});

		it("refuses a second plan while one is unfinished", () => {
			const agent = session(state([["Translate it", "pending"]]));
			const result = agent.createPlan(["Something", "Else"]);

			expect(result).toMatchObject({ ok: false });
			expect(agent.plan?.tasks[0].title).toBe("Translate it");
		});

		it("ticks a task off and counts what is left", () => {
			const agent = session();
			agent.createPlan(["Add drinks", "Translate it"]);
			const result = agent.completeTask(0, 'added "Drinks" with 8 items');

			expect(result).toMatchObject({ ok: true, remaining: 1 });
			expect(agent.plan?.tasks[0]).toMatchObject({
				status: "done",
				note: 'added "Drinks" with 8 items',
			});
		});

		it("bumps the revision on every change, so a stalled round is visible", () => {
			const agent = session();
			agent.createPlan(["One", "Two"]);
			const first = agent.plan?.revision as number;
			agent.completeTask(0);

			expect(agent.plan?.revision).toBe(first + 1);
		});

		it("hands back a snapshot, not the live plan", () => {
			// Each tool result has to be the state when it ran; sharing one object
			// would rewrite the history of the round as it went.
			const agent = session();
			const created = agent.createPlan(["One", "Two"]);
			agent.completeTask(0);

			expect((created as { plan: PlanState }).plan.tasks[0].status).toBe(
				"pending",
			);
		});

		it("explains an out-of-range task instead of dropping it", () => {
			const agent = session();
			agent.createPlan(["One", "Two"]);

			expect(agent.completeTask(7)).toMatchObject({
				ok: false,
				error: expect.stringContaining("no task [7]"),
			});
		});

		it("refuses to settle the same task twice", () => {
			const agent = session();
			agent.createPlan(["One", "Two"]);
			agent.completeTask(0);

			expect(agent.completeTask(0)).toMatchObject({ ok: false });
		});

		it("says there is no plan rather than inventing one", () => {
			expect(session().completeTask(0)).toMatchObject({
				ok: false,
				error: expect.stringContaining("no plan"),
			});
		});

		it("skips a task that cannot be done, so the list can still finish", () => {
			// Without this the browser's resume loop has nothing to converge on.
			const agent = session();
			agent.createPlan(["Add a map", "Translate it"]);
			agent.skipTask(0, "you have not given me the embed code");
			agent.completeTask(1);

			expect(isPlanFinished(agent.plan as PlanState)).toBe(true);
			expect(agent.plan?.tasks[0]).toMatchObject({
				status: "skipped",
				note: "you have not given me the embed code",
			});
		});

		it("points the resume block at the first unfinished task", () => {
			const agent = session();
			agent.createPlan(["One", "Two", "Three"]);
			agent.completeTask(0, "did it");

			const snapshot = agent.planSnapshot();
			expect(snapshot).toContain("[0] [x] One - did it");
			expect(snapshot).toContain("[1] [ ] Two");
			expect(snapshot).toContain("Carry on with task [1]");
			expect(activeTaskIndex(agent.plan as PlanState)).toBe(1);
		});

		it("tells the agent to stop once every task is settled", () => {
			const agent = session();
			agent.createPlan(["One", "Two"]);
			agent.completeTask(0);
			agent.completeTask(1);

			expect(agent.planSnapshot()).toContain("Every task is settled");
		});

		it("renders nothing when there is no plan", () => {
			expect(session().planSnapshot()).toBe("");
		});
	});
});

describe("resumeDecision", () => {
	const unfinished = state(
		[
			["Add drinks", "done"],
			["Translate it", "pending"],
		],
		2,
	);

	const at = (overrides: Partial<ResumeState> = {}): ResumeState => ({
		plan: unfinished,
		failed: false,
		continuations: 0,
		lastRevision: -1,
		...overrides,
	});

	it("resumes a plan with work left", () => {
		expect(resumeDecision(at())).toEqual({ action: "resume" });
	});

	it("does nothing for a request that never needed a plan", () => {
		expect(resumeDecision(at({ plan: null }))).toEqual({ action: "wait" });
	});

	it("does nothing once every task is settled", () => {
		const done = state(
			[
				["Add drinks", "done"],
				["Add a map", "skipped"],
			],
			3,
		);

		expect(resumeDecision(at({ plan: done }))).toEqual({ action: "wait" });
	});

	it("stops after a failed round rather than retrying into the same wall", () => {
		expect(resumeDecision(at({ failed: true }))).toEqual({
			action: "halt",
			halt: "failed",
		});
	});

	it("stops when a round settled nothing", () => {
		// This is the guard that keeps a model which stopped calling completeTask
		// from looping forever at the user's expense.
		expect(
			resumeDecision(
				at({ continuations: 1, lastRevision: unfinished.revision }),
			),
		).toEqual({ action: "halt", halt: "stalled" });
	});

	it("stops at the continuation ceiling", () => {
		expect(
			resumeDecision(at({ continuations: MAX_PLAN_CONTINUATIONS })),
		).toEqual({ action: "halt", halt: "exhausted" });
	});

	it("checks a failure before anything else", () => {
		// A failed round that also moved nothing is a failure, not a stall: the
		// user needs to know the request broke, not that the agent gave up.
		expect(
			resumeDecision(
				at({
					failed: true,
					continuations: MAX_PLAN_CONTINUATIONS,
					lastRevision: unfinished.revision,
				}),
			),
		).toEqual({ action: "halt", halt: "failed" });
	});

	it("keeps resuming while every round moves the list on", () => {
		// The happy path over a whole plan: each round settles something, so the
		// revision climbs and the ceiling is never reached.
		let lastRevision = -1;
		for (let round = 0; round < MAX_PLAN_CONTINUATIONS; round += 1) {
			const plan = state(
				[
					["One", "done"],
					["Two", "pending"],
				],
				round + 2,
			);
			const decision = resumeDecision(
				at({
					plan,
					continuations: round,
					lastRevision,
				}),
			);

			expect(decision).toEqual({ action: "resume" });
			lastRevision = plan.revision;
		}
	});
});
