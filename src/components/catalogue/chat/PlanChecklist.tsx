"use client";
import {
	activeTaskIndex,
	isPlanFinished,
	type PlanHalt,
	type PlanState,
} from "@/agent/plan";
import { estimatePlanCredits } from "@/lib/ai/pricing";
import { AlertTriangle, Check, ListChecks, Loader2 } from "lucide-react";

/** Every one of these leaves tasks unfinished, so each says what to do next. */
const HALT_NOTICES: Record<PlanHalt, string> = {
	stalled:
		"Stopped - the last round did not get anywhere. Ask again for whatever is still missing.",
	exhausted:
		"Stopped after several rounds. Ask again for whatever is still missing.",
	failed:
		"Stopped after an error. Everything ticked above is already in your draft.",
	credits:
		"Stopped - you are out of AI credits for this month. Everything ticked above is already in your draft.",
};

const Marker = ({
	status,
	active,
}: {
	status: PlanState["tasks"][number]["status"];
	active: boolean;
}) => {
	if (status === "done") {
		return (
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-product-success-soft text-product-success">
				<Check aria-hidden="true" className="h-2.5 w-2.5 stroke-[3]" />
				<span className="sr-only">Done:</span>
			</span>
		);
	}
	if (status === "skipped") {
		return (
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-product-warning/15 text-product-warning">
				<AlertTriangle aria-hidden="true" className="h-2.5 w-2.5 stroke-[3]" />
				<span className="sr-only">Skipped:</span>
			</span>
		);
	}
	if (active) {
		return (
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
				<Loader2
					aria-hidden="true"
					className="h-3.5 w-3.5 animate-spin text-product-primary-ink motion-reduce:animate-none"
				/>
				<span className="sr-only">In progress:</span>
			</span>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-product-border"
		/>
	);
};

/**
 * The to-do list the agent wrote for a multi-part request, ticking off live.
 * The honest status display for a plan spanning several requests, where a bare
 * spinner would look like a hang between them - and where a misread request
 * gets caught, since the user sees what was understood before edits start.
 */
const PlanChecklist = ({
	plan,
	running,
	halt,
}: {
	plan: PlanState;
	running: boolean;
	halt: PlanHalt | null;
}) => {
	const settled = plan.tasks.filter((task) => task.status !== "pending").length;
	const active = running && !halt ? activeTaskIndex(plan) : -1;
	const finished = isPlanFinished(plan);

	return (
		<div className="animate-in space-y-2.5 rounded-[18px] border border-product-border bg-product-card px-3.5 py-3 duration-200 fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
			<div className="flex items-center justify-between gap-3">
				<p className="flex min-w-0 items-center gap-2 font-product-heading text-[13px] font-bold text-product-foreground">
					<ListChecks
						aria-hidden="true"
						className="h-4 w-4 shrink-0 text-product-primary-ink"
					/>
					<span className="truncate">
						{finished
							? "All done"
							: `Working through ${plan.tasks.length} things · about ${estimatePlanCredits(plan.tasks.length)} credits`}
					</span>
				</p>
				<span className="shrink-0 text-xs font-semibold tabular-nums text-product-muted">
					{settled} / {plan.tasks.length}
				</span>
			</div>

			<ul className="space-y-1.5">
				{plan.tasks.map((task, index) => (
					<li
						className="flex items-start gap-2 text-[13px] leading-relaxed"
						// Titles can repeat across a plan, so the position is the identity.
						key={`${index}-${task.title}`}
					>
						<Marker active={index === active} status={task.status} />
						<span className="min-w-0">
							<span
								className={
									task.status === "pending"
										? "text-product-foreground-accent"
										: "text-product-foreground"
								}
							>
								{task.title}
							</span>
							{task.note && (
								<span className="block text-xs leading-snug text-product-muted">
									{task.note}
								</span>
							)}
						</span>
					</li>
				))}
			</ul>

			{halt && (
				<p className="flex items-start gap-2 rounded-xl bg-product-primary-soft px-2.5 py-2 text-xs leading-relaxed text-product-primary-ink">
					<AlertTriangle
						aria-hidden="true"
						className="mt-px h-3.5 w-3.5 shrink-0"
					/>
					{HALT_NOTICES[halt]}
				</p>
			)}
		</div>
	);
};

export default PlanChecklist;
