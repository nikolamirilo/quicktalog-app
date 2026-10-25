import { CREDITS } from "@/lib/ai/pricing";

export type RequestBudget = {
	/** Credits this request may commit beyond the base, as held by the database. */
	available: number;
	/** True when this request took the base charge, which pays for its first task. */
	baseCoversFirstTask: boolean;
};

/** The tool error a refused billable step returns. The model must stop and say so. */
export const OUT_OF_CREDITS =
	"The user is out of AI credits for this request. Make no more changes. Tell them which tasks are done, which are left, and that credits reset on the 1st of the month or come with a bigger plan.";

/** No ledger behind it: tests and code paths that never meter. */
export const UNMETERED: RequestBudget = {
	available: Number.POSITIVE_INFINITY,
	baseCoversFirstTask: true,
};

/**
 * What one request may spend, and what it has spent. Every billable step is
 * paid for before it happens - a page read before Firecrawl is called, a task
 * before its first edit lands - so the request can never bill past its hold.
 *
 * A task is billed when it is completed, or when it is skipped after one of its
 * edits landed. A reservation still pending when the request ends is not
 * billed: the request that finishes the task pays for it.
 */
export class RequestCredits {
	private readonly available: number;
	private baseFree: boolean;
	private fetchCredits = 0;
	private readonly reservations = new Map<number, "base" | "credit">();
	private readonly edited = new Set<number>();
	private readonly billedTasks = new Set<number>();
	private refused = false;

	constructor(budget: RequestBudget) {
		this.available = budget.available;
		this.baseFree = budget.baseCoversFirstTask;
	}

	private get committed(): number {
		let tasks = 0;
		for (const kind of this.reservations.values()) {
			if (kind === "credit") tasks += 1;
		}
		return this.fetchCredits + tasks * CREDITS.perExtraTask;
	}

	get billed(): number {
		return this.fetchCredits + this.billedTasks.size * CREDITS.perExtraTask;
	}

	get exhausted(): boolean {
		return this.refused;
	}

	/** Credits not yet committed to a task or a page read. */
	get creditsLeft(): number {
		return this.available - this.committed;
	}

	get tasksAffordable(): number {
		const left = this.available - this.committed;
		return (this.baseFree ? 1 : 0) + Math.floor(left / CREDITS.perExtraTask);
	}

	payForFetch(): boolean {
		if (this.committed + CREDITS.perPageFetch > this.available) return false;
		this.fetchCredits += CREDITS.perPageFetch;
		return true;
	}

	reserveTask(index: number): boolean {
		if (this.reservations.has(index)) return true;
		if (this.baseFree) {
			this.baseFree = false;
			this.reservations.set(index, "base");
			return true;
		}
		if (this.committed + CREDITS.perExtraTask > this.available) {
			this.refused = true;
			return false;
		}
		this.reservations.set(index, "credit");
		return true;
	}

	recordEdit(index: number): void {
		this.edited.add(index);
	}

	settleTask(index: number, status: "done" | "skipped"): boolean {
		const billable = status === "done" || this.edited.has(index);
		if (!billable) {
			if (this.reservations.get(index) === "base") this.baseFree = true;
			this.reservations.delete(index);
			return true;
		}
		if (!this.reserveTask(index)) return false;
		if (this.reservations.get(index) === "credit") this.billedTasks.add(index);
		return true;
	}
}
