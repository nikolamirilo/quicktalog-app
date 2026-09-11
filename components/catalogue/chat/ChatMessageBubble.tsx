"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import type { AgentToolResult } from "@/types/ai";
import { isToolUIPart } from "ai";
import { AlertTriangle, Check, Loader2, Sparkles } from "lucide-react";

/** Turns "tool-addSection" into something a person can read while it runs. */
const RUNNING_LABELS: Record<string, string> = {
	readSection: "Reading a section",
	addSection: "Adding a section",
	updateSection: "Updating a section",
	deleteSection: "Deleting a section",
	moveSection: "Moving a section",
	addItems: "Adding items",
	updateItem: "Updating an item",
	deleteItem: "Deleting an item",
	moveItem: "Moving an item",
	updateCatalogue: "Updating catalogue settings",
	updateAppearance: "Updating the appearance",
};

const Change = ({ text }: { text: string }) => (
	<li className="flex items-start gap-2 text-xs leading-relaxed">
		<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
			<Check className="h-2.5 w-2.5 text-emerald-700" />
		</span>
		<span className="text-product-foreground-accent">{text}</span>
	</li>
);

const Skipped = ({ text }: { text: string }) => (
	<li className="flex items-start gap-2 text-xs leading-relaxed">
		<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100">
			<AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
		</span>
		<span className="text-product-foreground-accent">{text}</span>
	</li>
);

/**
 * One turn in the AI chat. Assistant turns interleave the agent's text with the
 * edits it made, in the order they happened, so the user can watch it work.
 */
const ChatMessageBubble = ({
	message,
}: {
	message: CatalogueAgentUIMessage;
}) => {
	const isUser = message.role === "user";

	const body = message.parts.map((part, index) => {
		if (part.type === "text") {
			return part.text ? (
				<p className="whitespace-pre-wrap" key={`${message.id}-text-${index}`}>
					{part.text}
				</p>
			) : null;
		}

		if (!isToolUIPart(part)) return null;

		const name = part.type.replace(/^tool-/, "");
		const key = part.toolCallId;

		if (part.state === "input-streaming" || part.state === "input-available") {
			return (
				<p
					className="flex items-center gap-1.5 text-xs text-product-foreground-accent"
					key={key}
				>
					<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-product-primary" />
					{RUNNING_LABELS[name] ?? "Working"}…
				</p>
			);
		}

		if (part.state === "output-error") {
			return (
				<ul className="space-y-1.5" key={key}>
					<Skipped text={part.errorText} />
				</ul>
			);
		}

		if (part.state !== "output-available") return null;

		// readSection is the agent looking things up; it has nothing to report.
		if (name === "readSection") return null;

		const output = part.output as AgentToolResult | undefined;
		// A rejected edit is the agent's own feedback loop - it reads the
		// reason and corrects itself, then explains anything the user needs
		// to know in its reply. Surfacing it here would just be noise.
		if (!output?.ok) return null;

		return (
			<ul
				className="space-y-1.5 rounded-xl bg-product-background-hover px-2.5 py-2"
				key={key}
			>
				<Change text={output.summary} />
				{output.imageMisses?.map((miss) => (
					<Skipped
						key={`${key}-${miss}`}
						text={`No photo found for "${miss}".`}
					/>
				))}
			</ul>
		);
	});

	// A turn can be all filtered-out parts (a lone readSection, a rejected
	// edit) - don't leave an empty bubble behind.
	if (!body.some(Boolean)) return null;

	if (isUser) {
		return (
			<div className="flex animate-in justify-end duration-200 fade-in slide-in-from-bottom-1">
				<div className="max-w-[85%] space-y-2 rounded-2xl rounded-br-md bg-product-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-product-foreground shadow-sm">
					{body}
				</div>
			</div>
		);
	}

	return (
		<div className="flex animate-in items-start gap-2.5 duration-200 fade-in slide-in-from-bottom-1">
			<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-product-border bg-white shadow-sm">
				<Sparkles className="h-3.5 w-3.5 text-product-primary" />
			</span>
			<div className="max-w-[85%] space-y-2 rounded-2xl rounded-tl-md border border-product-border bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-product-foreground shadow-sm">
				{body}
			</div>
		</div>
	);
};

export default ChatMessageBubble;
