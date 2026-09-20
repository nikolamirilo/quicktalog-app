"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import { SCANNED_TEXT_MARKER } from "@/agent/attachments";
import { CONTINUE_PLAN_MARKER } from "@/agent/plan";
import { isHiddenTool, runningLabel } from "@/agent/tools/display";
import type { AgentToolResult } from "@/types/ai";
import { isToolUIPart } from "ai";
import {
	AlertTriangle,
	Check,
	Globe,
	Loader2,
	ScanText,
	Sparkles,
} from "lucide-react";

/**
 * The OCR that travelled with the turn. It is part of what the user said, so it
 * belongs in their bubble - but printing a page of raw scan would bury the one
 * line they actually typed, so it stays folded until they open it.
 */
const ScannedText = ({ text }: { text: string }) => {
	const count = text.match(/^--- Image \d+ ---$/gm)?.length ?? 0;

	return (
		<details className="rounded-lg bg-black/5 px-2.5 py-1.5">
			<summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-bold">
				<ScanText className="h-3 w-3 shrink-0" />
				Text read from {count} image{count === 1 ? "" : "s"}
			</summary>
			<pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-snug opacity-80">
				{text.slice(SCANNED_TEXT_MARKER.length).trim()}
			</pre>
		</details>
	);
};

const Change = ({ text }: { text: string }) => (
	<li className="flex items-start gap-2 text-xs leading-relaxed">
		<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
			<Check className="h-2.5 w-2.5 text-emerald-700" />
		</span>
		<span className="text-product-foreground-accent">{text}</span>
	</li>
);

/** A page the agent read. Not a change, so it does not get the green tick. */
const Read = ({ text }: { text: string }) => (
	<li className="flex items-start gap-2 text-xs leading-relaxed">
		<span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100">
			<Globe className="h-2.5 w-2.5 text-sky-700" />
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
			if (!part.text) return null;
			// Resuming a plan is the builder talking to the agent, not the user
			// talking to either. Showing it would turn one request into a column
			// of identical bubbles.
			if (part.text.trim() === CONTINUE_PLAN_MARKER) return null;
			const key = `${message.id}-text-${index}`;
			return part.text.startsWith(SCANNED_TEXT_MARKER) ? (
				<ScannedText key={key} text={part.text} />
			) : (
				<p className="whitespace-pre-wrap" key={key}>
					{part.text}
				</p>
			);
		}

		if (!isToolUIPart(part)) return null;

		const name = part.type.replace(/^tool-/, "");
		const key = part.toolCallId;

		// The plan tools have their own display - one checklist for the whole
		// request, rendered by the panel - so they contribute nothing here.
		if (isHiddenTool(name)) return null;

		if (part.state === "input-streaming" || part.state === "input-available") {
			return (
				<p
					className="flex items-center gap-1.5 text-xs text-product-foreground-accent"
					key={key}
				>
					<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-product-primary" />
					{runningLabel(name)}…
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

		// A fetch reads something the user can go and check, so unlike the other
		// reads it is worth a line. A failed one renders nothing: the agent
		// explains that in its reply, same as a rejected edit.
		if (name === "fetchUrl") {
			const page = part.output as { summary?: string } | undefined;
			return page?.summary ? (
				<ul className="space-y-1.5" key={key}>
					<Read text={page.summary} />
				</ul>
			) : null;
		}

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
