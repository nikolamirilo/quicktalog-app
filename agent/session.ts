import {
	activeTaskIndex,
	clonePlan,
	isPlanFinished,
	MAX_TASK_NOTE_CHARS,
	pendingCount,
	type PlanState,
	type PlanTaskStatus,
	type PlanToolResult,
} from "@/agent/plan";
import { allowedSectionTypes } from "@/agent/schemas";
import { activeSkills, findSkill } from "@/agent/skills";
import type { SkillGateCall } from "@/agent/skills/types";
import {
	applyCatalogueOperations,
	type OperationLimits,
} from "@/helpers/catalogueOperations";
import { isItemsBlock, normalizeContent } from "@/helpers/contentBlocks";
import type { AiPlanLimits } from "@/lib/ai/limits";
import type {
	AgentToolResult,
	AiSectionAccess,
	CatalogueOperation,
} from "@/types/ai";
import {
	type AnyItemsBlock,
	type Catalogue,
	type ContentBlock,
	resolveBusinessType,
} from "@quicktalog/common";

const MAX_SNAPSHOT_SECTIONS = 40;
const MAX_SNAPSHOT_ITEMS = 40;
/** Each one is a Firecrawl credit and a chunk of context; the loop has 16 steps. */
/** Paid-plan defaults; the caller passes the plan's own numbers. See lib/ai/limits.ts. */
const DEFAULT_AI_LIMITS: AiPlanLimits = {
	maxFetches: 3,
	maxPlanTasks: 12,
	proModel: true,
	requireVerifiedEmail: false,
};
/**
 * How long a request keeps taking new steps before handing the rest of the
 * plan to the next one. Stops at 38s to clear `AGENT_TIMEOUT_MS` and the
 * platform's `maxDuration`, with room for a slow `addSection` to land.
 */
const TURN_BUDGET_MS = 38_000;

type ItemBlock = AnyItemsBlock;

const isItemBlock = (block: ContentBlock): block is ItemBlock =>
	isItemsBlock(block);

const stripHtml = (value: string): string =>
	value
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const truncate = (value: string, max: number): string =>
	value.length > max ? `${value.slice(0, max)}…` : value;

/** Working copy a turn's tools edit, so a bad index can be answered rather than dropped. */
export class CatalogueSession {
	working: Catalogue;
	readonly limits: OperationLimits;
	readonly access?: AiSectionAccess;
	/** Replayed against the builder draft in order. */
	readonly operations: CatalogueOperation[] = [];
	readonly applied: string[] = [];

	/** Pages read in this request only - earlier ones are already paid for. */
	get fetchesThisRequest(): number {
		return this.fetches - this.fetchesAtStart;
	}

	/**
	 * Plan tasks *completed* in this request - the billable unit. Not
	 * `applied.length`, which counts one entry per edit, so a single task that
	 * adds ten items would otherwise be charged ten times. Skipped tasks are
	 * free, or the model could skip its way to a cheap turn.
	 */
	get tasksSettledThisRequest(): number {
		return this.tasksCompleted;
	}
	/** Clerk id of the caller, so tools that touch the database do not re-query it. */
	readonly userId?: string;
	/** The multi-part request being worked, restored from history on a resume. */
	plan: PlanState | null;
	private readonly loadedSkills: Set<string>;
	private readonly startedAt = Date.now();
	private fetches = 0;
	private fetchesAtStart = 0;
	private tasksCompleted = 0;

	constructor(
		catalogue: Catalogue,
		limits: OperationLimits = {},
		access?: AiSectionAccess,
		loadedSkills: string[] = [],
		userId?: string,
		plan: PlanState | null = null,
		/** Pages already read earlier in this ask; see `fetchesFromMessages`. */
		fetches = 0,
		readonly aiLimits: AiPlanLimits = DEFAULT_AI_LIMITS,
	) {
		// Normalized up front so the snapshot shows the model the same section
		// vocabulary its tools accept, even for a row still on a legacy key.
		this.working = {
			...catalogue,
			content: normalizeContent(catalogue.content),
		};
		this.limits = limits;
		this.access = access;
		this.loadedSkills = new Set(loadedSkills);
		this.userId = userId;
		this.plan = plan;
		this.fetches = fetches;
		this.fetchesAtStart = fetches;
	}

	/** False once the request has spent its share of the function budget; checked after every step so the loop ends on a clean boundary. */
	outOfTime(): boolean {
		return Date.now() - this.startedAt > TURN_BUDGET_MS;
	}

	createPlan(titles: string[]): PlanToolResult {
		if (this.plan && !isPlanFinished(this.plan)) {
			return {
				ok: false,
				error:
					"There is already a plan in progress. Work through the tasks that are left, or skip the ones that no longer apply.",
			};
		}

		if (titles.length > this.aiLimits.maxPlanTasks) {
			return {
				ok: false,
				error: `This plan has ${titles.length} tasks, more than the ${this.aiLimits.maxPlanTasks} allowed on this plan. Write a shorter plan that covers the most important parts first.`,
			};
		}

		this.plan = {
			tasks: titles.map((title) => ({ title, status: "pending" as const })),
			revision: 1,
		};
		return { ok: true, plan: clonePlan(this.plan), remaining: titles.length };
	}

	completeTask(index: number, note?: string): PlanToolResult {
		return this.settleTask(index, "done", note);
	}

	skipTask(index: number, reason: string): PlanToolResult {
		return this.settleTask(index, "skipped", reason);
	}

	/** `skipTask` is always available so a task the model can't complete can't spin the resume loop forever. */
	private settleTask(
		index: number,
		status: Exclude<PlanTaskStatus, "pending">,
		note?: string,
	): PlanToolResult {
		const plan = this.plan;
		if (!plan) {
			return {
				ok: false,
				error:
					"There is no plan yet. Call createPlan first, or just make the change without one.",
			};
		}

		const task = plan.tasks[index];
		if (!task) {
			return {
				ok: false,
				error: `There is no task [${index}]. The plan has ${plan.tasks.length} task(s), [0] to [${plan.tasks.length - 1}].`,
			};
		}
		if (task.status !== "pending") {
			return {
				ok: false,
				error: `Task [${index}] is already ${task.status}. Move on to the first task still marked [ ].`,
			};
		}

		const trimmed = note?.trim().slice(0, MAX_TASK_NOTE_CHARS);
		plan.tasks[index] = {
			...task,
			status,
			...(trimmed ? { note: trimmed } : {}),
		};
		plan.revision += 1;
		if (status === "done") this.tasksCompleted += 1;

		return { ok: true, plan: clonePlan(plan), remaining: pendingCount(plan) };
	}

	/** The resume block in the instructions. Indices match completeTask's input. */
	planSnapshot(): string {
		const plan = this.plan;
		if (!plan) return "";

		const mark = { pending: " ", done: "x", skipped: "-" } as const;
		const lines = plan.tasks.map((task, index) => {
			const note = task.note ? ` - ${task.note}` : "";
			return `  [${index}] [${mark[task.status]}] ${task.title}${note}`;
		});
		const next = activeTaskIndex(plan);

		return [
			"PLAN (resumed - everything ticked is already done and is in the CATALOGUE snapshot below):",
			...lines,
			next === -1
				? "Every task is settled. Tell the user what you did and call no more tools."
				: `Carry on with task [${next}]. Do not redo ticked work, and do not create a new plan.`,
		].join("\n");
	}

	loadSkill(
		name: string,
	): { skill: string; content: string } | { error: string } {
		const skill = findSkill(name);
		const available = activeSkills({
			sectionTypes: allowedSectionTypes(this.access),
		});

		if (!skill || !available.includes(skill)) {
			const names = available
				.filter((s) => s.load === "on-demand")
				.map((s) => s.name);
			return {
				error: `There is no skill called "${name}". Available: ${names.join(", ") || "none"}.`,
			};
		}

		this.loadedSkills.add(skill.name);
		return { skill: skill.name, content: skill.content };
	}

	/** Null when another page may be read. Counts attempts, so retries cost too. */
	allowWebFetch(): AgentToolResult | null {
		if (this.fetches >= this.aiLimits.maxFetches) {
			return {
				ok: false,
				error:
					this.aiLimits.maxFetches === 0
						? "Reading web pages is not available on this plan. Work from what the user has told you, or ask them to paste the text."
						: `You have already read ${this.aiLimits.maxFetches} pages working on this request, which is the limit. Work with what you have, or ask the user for the detail you are missing.`,
			};
		}
		this.fetches += 1;
		return null;
	}

	/** Null when the call may proceed. */
	requireSkills(call: SkillGateCall): AgentToolResult | null {
		const missing = activeSkills({
			sectionTypes: allowedSectionTypes(this.access),
		}).find(
			(skill) =>
				skill.load === "on-demand" &&
				!this.loadedSkills.has(skill.name) &&
				skill.requiredFor?.(call),
		);

		if (!missing) return null;

		return {
			ok: false,
			error: `Read the "${missing.name}" skill first: call loadSkill with name "${missing.name}", follow its rules, then retry this call.`,
		};
	}

	private get content(): ContentBlock[] {
		return this.working.content ?? [];
	}

	sectionAt(index: number): ContentBlock | undefined {
		return this.content[index];
	}

	/** Where a section sits now, so a result can tell the model what to point at next. */
	sectionIndex(id: string): number {
		return this.content.findIndex((block) => block.id === id);
	}

	resolveSection(index: number): { id: string } | { error: string } {
		const block = this.sectionAt(index);
		if (!block) {
			return {
				error: `There is no section [${index}]. The catalogue has ${this.content.length} section(s)${
					this.content.length > 0 ? `, [0] to [${this.content.length - 1}]` : ""
				}.`,
			};
		}
		return { id: block.id };
	}

	resolveItemSection(index: number): { id: string } | { error: string } {
		const block = this.sectionAt(index);
		if (!block) return this.resolveSection(index);
		if (!isItemBlock(block)) {
			return {
				error: `Section [${index}] is a "${block.type}" section, which cannot hold items. Only items sections can.`,
			};
		}
		return { id: block.id };
	}

	resolveItem(
		sectionIndex: number,
		itemIndex: number,
	): { sectionId: string; itemId: string; name: string } | { error: string } {
		const section = this.resolveItemSection(sectionIndex);
		if ("error" in section) return section;

		const block = this.sectionAt(sectionIndex) as ItemBlock;
		const items = block.items ?? [];
		const item = items[itemIndex];
		if (!item) {
			return {
				error: `There is no item [${itemIndex}] in section [${sectionIndex}]. It has ${items.length} item(s)${
					items.length > 0 ? `, [0] to [${items.length - 1}]` : ""
				}.`,
			};
		}
		return { sectionId: section.id, itemId: item.id, name: item.name };
	}

	/** The applier's skip reasons double as the model's feedback. */
	run(operation: CatalogueOperation): AgentToolResult {
		const outcome = applyCatalogueOperations(
			this.working,
			[operation],
			this.limits,
		);

		if (outcome.applied.length === 0) {
			return {
				ok: false,
				error: outcome.skipped[0] ?? "That edit could not be applied.",
				...(outcome.limitReached ? { limitReached: true } : {}),
			};
		}

		this.working = outcome.catalogue;
		this.operations.push(operation);
		this.applied.push(...outcome.applied);

		return { ok: true, operation, summary: outcome.applied.join(". ") };
	}

	private describeItems(block: ContentBlock): string[] {
		if (!isItemBlock(block)) return [];
		const items = block.items ?? [];
		const lines = items.slice(0, MAX_SNAPSHOT_ITEMS).map((item, index) => {
			const price = item.isFree ? "free" : String(item.price ?? 0);
			const description = item.description
				? ` - ${truncate(stripHtml(item.description), 80)}`
				: "";
			const image = item.image ? " [img]" : "";
			return `    [${index}] "${item.name}" ${price}${image}${description}`;
		});
		if (items.length > MAX_SNAPSHOT_ITEMS) {
			lines.push(
				`    …and ${items.length - MAX_SNAPSHOT_ITEMS} more items - call readSection to see them`,
			);
		}
		return lines;
	}

	/** Indices in this text are the contract the model points with. */
	snapshot(): string {
		const { style, theme } = this.working.appearance;
		const content = this.content;
		const lines: string[] = [
			`SLUG: ${this.working.name}`,
			`HEADING: ${truncate(stripHtml(this.working.heading ?? ""), 160) || "(empty)"}`,
			`CURRENCY: ${this.working.currency} | LANGUAGE: ${this.working.language} | BUSINESS TYPE: ${resolveBusinessType(this.working.businessType)?.label ?? "(unset)"}`,
			`APPEARANCE: theme=${theme.name} font=${style.fontFamily} size=${style.contentFontSize} radius=${style.borderRadius} shadow=${style.shadow}`,
			`SECTIONS (${content.length}):`,
		];

		if (content.length === 0) lines.push("  (none yet)");

		content.slice(0, MAX_SNAPSHOT_SECTIONS).forEach((block, index) => {
			if (isItemBlock(block)) {
				lines.push(
					`  [${index}] ${block.type} "${block.name}" layout=${block.layout} items=${block.items?.length ?? 0}`,
				);
				lines.push(...this.describeItems(block));
			} else if (block.type === "text") {
				lines.push(
					`  [${index}] text${block.name ? ` "${block.name}"` : ""} - "${truncate(stripHtml(block.content ?? ""), 160)}"`,
				);
			} else if (block.type === "custom_code" || block.type === "embedding") {
				// Blocks predating `name` have none, so fall back to a markup excerpt.
				const hint =
					block.name ||
					truncate((block.code ?? "").replace(/\s+/g, " ").trim(), 140) ||
					"(empty)";
				lines.push(`  [${index}] ${block.type} - ${hint}`);
			} else {
				lines.push(
					`  [${index}] ${block.type}${block.name ? ` - ${block.name}` : ""}`,
				);
			}
		});

		if (content.length > MAX_SNAPSHOT_SECTIONS) {
			lines.push(
				`  …and ${content.length - MAX_SNAPSHOT_SECTIONS} more sections`,
			);
		}

		return lines.join("\n");
	}
}
