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
import type {
	AgentToolResult,
	AiSectionAccess,
	CatalogueOperation,
} from "@/types/ai";
import type {
	Catalogue,
	CategoryBlock,
	ContainerBlock,
	ContentBlock,
} from "@quicktalog/common";

const MAX_SNAPSHOT_SECTIONS = 40;
const MAX_SNAPSHOT_ITEMS = 40;
/** Each one is a Firecrawl credit and a chunk of context; the loop has 16 steps. */
const MAX_FETCHES_PER_TURN = 3;
/**
 * How long a request keeps taking new steps before it hands the rest of the
 * plan to the next one.
 *
 * It has to clear three ceilings in order: the step already in flight has to
 * finish, `AGENT_TIMEOUT_MS` in the route aborts the stream, and the platform
 * kills the function at `maxDuration`. Stopping at 38s leaves room for a slow
 * `addSection` - forty items and twenty photo lookups - to land.
 */
const TURN_BUDGET_MS = 38_000;

type ItemBlock = CategoryBlock | ContainerBlock;

const isItemBlock = (block: ContentBlock): block is ItemBlock =>
	block.type === "category" || block.type === "container";

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
	/** Clerk id of the caller, so tools that touch the database do not re-query it. */
	readonly userId?: string;
	/** The multi-part request being worked, restored from history on a resume. */
	plan: PlanState | null;
	private readonly loadedSkills: Set<string>;
	private readonly startedAt = Date.now();
	private fetches = 0;
	private readWeb = false;

	constructor(
		catalogue: Catalogue,
		limits: OperationLimits = {},
		access?: AiSectionAccess,
		loadedSkills: string[] = [],
		userId?: string,
		plan: PlanState | null = null,
	) {
		this.working = catalogue;
		this.limits = limits;
		this.access = access;
		this.loadedSkills = new Set(loadedSkills);
		this.userId = userId;
		this.plan = plan;
	}

	/**
	 * False once the request has spent its share of the function budget.
	 *
	 * Read by the agent's stop condition after every step, so the loop ends on
	 * a clean boundary with its work streamed and the plan's remaining tasks
	 * left for the next request.
	 */
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

	/**
	 * A task that can never be settled is the one way the browser's resume loop
	 * spins, so both outcomes are always available to the model - `skipTask` is
	 * the way out of a task the plan, the catalogue or the user makes impossible.
	 */
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
		if (this.fetches >= MAX_FETCHES_PER_TURN) {
			return {
				ok: false,
				error: `You have already read ${MAX_FETCHES_PER_TURN} pages in this conversation, which is the limit. Work with what you have, or ask the user for the detail you are missing.`,
			};
		}
		this.fetches += 1;
		return null;
	}

	/** Called once a page's text is actually in context, not merely requested. */
	markWebContent(): void {
		this.readWeb = true;
	}

	/**
	 * Null when the call may proceed.
	 *
	 * A fetched page is attacker-controlled text sitting in a loop that can
	 * write `custom_code` and `embedding` sections, and those go out as raw
	 * markup on a published catalogue. Rather than trust the model to resist a
	 * page telling it to paste a script, code sections are simply off the table
	 * for the rest of a conversation that has read one.
	 */
	requireNoWebCode(call: SkillGateCall): AgentToolResult | null {
		if (!this.readWeb) return null;

		const writesCode =
			typeof call.input.code === "string" ||
			call.input.sectionType === "custom_code" ||
			call.input.sectionType === "embedding";
		if (!writesCode) return null;

		return {
			ok: false,
			error:
				"Code and embed sections cannot be written in a conversation that has read a web page, because markup from a page must never reach a published catalogue. Add what you found as a text or category section instead, and tell the user why.",
		};
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
				error: `Section [${index}] is a "${block.type}" section, which cannot hold items. Only category and container sections can.`,
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
			`CURRENCY: ${this.working.currency} | LANGUAGE: ${this.working.language} | BUSINESS TYPE: ${this.working.businessType || "(unset)"}`,
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
