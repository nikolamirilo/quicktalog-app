"use client";
import {
	activeTaskIndex,
	isPlanFinished,
	type PlanHalt,
	type PlanState,
} from "@/agent/plan";
import { AlertTriangle, Check, ListChecks, Loader2 } from "lucide-react";

/** Every one of these leaves tasks unfinished, so each says what to do next. */
const HALT_NOTICES: Record<PlanHalt, string> = {
	stalled:
		"Stopped - the last round did not get anywhere. Ask again for whatever is still missing.",
	exhausted:
		"Stopped after several rounds. Ask again for whatever is still missing.",
	failed:
		"Stopped after an error. Everything ticked above is already in your draft.",
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
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
				<Check className="h-2.5 w-2.5 text-emerald-700" />
			</span>
		);
	}
	if (status === "skipped") {
		return (
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100">
				<AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
			</span>
		);
	}
	if (active) {
		return (
			<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
				<Loader2 className="h-3.5 w-3.5 animate-spin text-product-primary" />
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
		<div className="animate-in space-y-2.5 rounded-2xl border border-product-border bg-white px-3.5 py-3 shadow-sm duration-200 fade-in slide-in-from-bottom-1">
			<div className="flex items-center justify-between gap-3">
				<p className="flex min-w-0 items-center gap-2 font-lora-semibold text-[13px] font-bold text-product-foreground">
					<ListChecks className="h-4 w-4 shrink-0 text-product-primary" />
					<span className="truncate">
						{finished
							? "All done"
							: `Working through ${plan.tasks.length} things`}
					</span>
				</p>
				<span className="shrink-0 text-[11px] font-bold tabular-nums text-product-foreground-accent">
					{settled} / {plan.tasks.length}
				</span>
			</div>

			<ul className="space-y-1.5">
				{plan.tasks.map((task, index) => (
					<li
						className="flex items-start gap-2 text-xs leading-relaxed"
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
								<span className="block text-[11px] leading-snug text-product-foreground-accent">
									{task.note}
								</span>
							)}
						</span>
					</li>
				))}
			</ul>

			{halt && (
				<p className="flex items-start gap-2 rounded-xl bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-700">
					<AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
					{HALT_NOTICES[halt]}
				</p>
			)}
		</div>
	);
};

export default PlanChecklist;
