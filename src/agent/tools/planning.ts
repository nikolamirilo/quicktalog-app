import {
	MAX_PLAN_TASKS,
	MAX_TASK_NOTE_CHARS,
	MAX_TASK_TITLE_CHARS,
	MIN_PLAN_TASKS,
} from "@/agent/plan";
import type { ToolContext } from "@/agent/tools/types";
import { tool } from "ai";
import { z } from "zod";

const taskIndexSchema = z.coerce
	.number()
	.int()
	.min(0)
	.describe("The [index] of the task as shown in the plan.");

/** The to-do list the user watches tick off while a long request is worked. */
export const planningTools = ({ session }: ToolContext) => ({
	createPlan: tool({
		description:
			"Write down a to-do list before starting a request that has several distinct pieces of work in it, or one big enough to take many edits. The user sees the list and watches it tick off. Call it once, before the first edit.",
		inputSchema: z.object({
			tasks: z
				.array(z.string().trim().min(1).max(MAX_TASK_TITLE_CHARS))
				.min(MIN_PLAN_TASKS)
				.max(MAX_PLAN_TASKS)
				.describe(
					"One short line per piece of work, in the order you will do them and in the user's language. Phrase each one as the outcome the user asked for, not as the tool you will call.",
				),
		}),
		execute: async ({ tasks }) => session.createPlan(tasks),
	}),

	completeTask: tool({
		description:
			"Mark one task on the plan as done, once its edits have actually landed. Call it before starting the next task.",
		inputSchema: z.object({
			task: taskIndexSchema,
			note: z
				.string()
				.trim()
				.max(MAX_TASK_NOTE_CHARS)
				.optional()
				.describe(
					"One short phrase saying what you did, shown under the task in the list.",
				),
		}),
		execute: async ({ task, note }) => session.completeTask(task, note),
	}),

	skipTask: tool({
		description:
			"Mark one task on the plan as impossible and move on. Use it when a task cannot be done at all - the user's plan does not unlock the section type, they never supplied the embed snippet you need, or they asked for something that is not there - rather than leaving it unfinished.",
		inputSchema: z.object({
			task: taskIndexSchema,
			reason: z
				.string()
				.trim()
				.min(1)
				.max(MAX_TASK_NOTE_CHARS)
				.describe(
					"One short phrase the user will read, saying why it could not be done.",
				),
		}),
		execute: async ({ task, reason }) => session.skipTask(task, reason),
	}),
});
