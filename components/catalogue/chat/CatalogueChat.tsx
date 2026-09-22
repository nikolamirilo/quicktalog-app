"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import ChatImageAttachments, {
	ChatAttachButton,
} from "@/components/catalogue/chat/ChatImageAttachments";
import ChatMessageBubble from "@/components/catalogue/chat/ChatMessageBubble";
import PlanChecklist from "@/components/catalogue/chat/PlanChecklist";
import LimitsModal from "@/components/modals/LimitsModal";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { getRequiredPlan } from "@/helpers/client";
import { useCatalogueChat } from "@/hooks/useCatalogueChat";
import { usePastedImages } from "@/hooks/usePastedImages";
import type { UserData } from "@quicktalog/common";
import { isToolUIPart } from "ai";
import {
	AlertCircle,
	ArrowUp,
	ChevronDown,
	CornerDownLeft,
	RotateCcw,
	Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Deliberately industry-neutral (a cuisine-specific suggestion reads as "not for me" to everyone else); each exercises a different tool group. */
const SUGGESTIONS = [
	"Add a new section with 6 items",
	"Make every description shorter and friendlier",
	"Raise every price by 10%",
	"Switch the theme to something more elegant",
];

/** Three-dot "thinking" indicator shown while the agent works. */
const TypingDots = () => (
	<span className="flex items-center gap-1">
		{[0, 150, 300].map((delay) => (
			<span
				className="h-1.5 w-1.5 animate-bounce rounded-full bg-product-primary"
				key={delay}
				style={{ animationDelay: `${delay}ms` }}
			/>
		))}
	</span>
);

/** Is the assistant visibly saying something right now - streaming text, or a tool still showing its spinner line? */
const isNarrating = (message?: CatalogueAgentUIMessage): boolean => {
	if (message?.role !== "assistant") return false;
	const part = message.parts[message.parts.length - 1];
	if (!part) return false;
	if (part.type === "text") return part.state === "streaming";
	if (isToolUIPart(part))
		return part.state === "input-streaming" || part.state === "input-available";
	return false;
};

/**
 * Floating AI assistant for the catalogue builder. Edits land in
 * `CatalogueContext` immediately; the user still saves/publishes normally.
 * Pinned to the product font (`font-lora`) rather than inherited, since the
 * builder writes the catalogue's own theme font onto `documentElement` and
 * this panel is product chrome, not catalogue content.
 */
const CatalogueChat = ({ userData }: { userData?: UserData }) => {
	const context = useCatalogueContext();
	const isOpen = context?.isChatOpen ?? false;
	const setIsOpen = context?.setIsChatOpen ?? (() => {});
	const [draft, setDraft] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const {
		messages,
		send,
		reset,
		attachments,
		loading,
		error,
		errorMessage,
		plan,
		planHalt,
		showAiLimits,
		setShowAiLimits,
		currentPlan,
		requiredPlan,
		contentLimitHit,
		setContentLimitHit,
	} = useCatalogueChat();

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [messages, loading, attachments.images]);

	// Pasted screenshots go through the same scan as the picker; ignored mid-turn, matching the attach button.
	usePastedImages(panelRef, (files) => {
		if (!loading) attachments.attach(files);
	});

	// Grow with the text; reset to auto first so it shrinks on delete. `max-h` caps it and hands over to scrolling.
	useEffect(() => {
		const field = inputRef.current;
		if (!field) return;
		field.style.height = "auto";
		field.style.height = `${field.scrollHeight}px`;
	}, [draft]);

	const canSubmit = (text: string) =>
		Boolean(text.trim()) && !loading && !attachments.scanning;

	const submit = (text: string) => {
		if (!canSubmit(text)) return;
		setDraft("");
		send(text);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit(draft);
		}
	};

	const isEmpty = messages.length === 0 && !loading;
	// Only shown when the assistant isn't already narrating itself (streaming text
	// or a running tool), and not while a plan's checklist is the status display instead.
	const isThinking =
		loading && !plan && !isNarrating(messages[messages.length - 1]);

	return (
		<>
			{!isOpen && (
				<button
					aria-label="Open AI assistant"
					className="group fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-3 z-[49] hidden h-11 w-auto min-w-[124px] items-center justify-center gap-2 rounded-full md:flex border border-black/5 bg-product-primary px-2.5 pl-1.5 pr-4 font-lora-semibold text-[13px] font-bold text-product-foreground shadow-[0_6px_18px_-6px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.3)] active:translate-y-0 active:scale-95 sm:left-4 md:bottom-6 md:left-6 md:h-auto md:min-w-0 md:py-1.5"
					onClick={() => setIsOpen(true)}
					type="button"
				>
					<span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 shadow-sm transition-transform duration-200 group-hover:rotate-12">
						<Sparkles className="h-3.5 w-3.5 text-product-foreground" />
					</span>
					<span>Ask AI</span>
				</button>
			)}

			{isOpen && (
				<div
					className="fixed inset-x-0 bottom-0 z-[1050] flex h-[92dvh] max-h-[92dvh] animate-in flex-col overflow-hidden rounded-t-3xl border border-product-border bg-white font-lora text-product-foreground shadow-[0_-12px_40px_-10px_rgba(0,0,0,0.35)] duration-300 fade-in slide-in-from-bottom-6 [padding-bottom:env(safe-area-inset-bottom)] md:inset-x-auto md:bottom-6 md:left-6 md:h-[600px] md:max-h-[calc(100dvh-3rem)] md:w-[420px] md:rounded-3xl md:[padding-bottom:0]"
					ref={panelRef}
				>
					{/* Drag handle — mobile-only affordance so the sheet feels native. */}
					<div className="flex shrink-0 justify-center pt-2 pb-1 md:hidden">
						<span
							aria-hidden="true"
							className="h-1.5 w-10 rounded-full bg-product-border"
						/>
					</div>
					<header className="relative flex shrink-0 items-center justify-between gap-3 border-b border-product-border bg-gradient-to-r from-product-background-hover to-white px-4 py-3 pt-1 md:pt-3.5">
						<div className="flex min-w-0 items-center gap-3">
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-product-primary shadow-sm">
								<Sparkles className="h-[18px] w-[18px] text-product-foreground" />
							</span>
							<div className="min-w-0">
								<p className="truncate font-lora-semibold text-[15px] font-bold leading-tight tracking-tight">
									AI assistant
								</p>
								<p className="truncate text-xs leading-tight text-product-foreground-accent">
									Ask for any change to this catalogue
								</p>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-0.5">
							{messages.length > 0 && (
								<button
									aria-label="Clear conversation"
									className="rounded-full p-2 text-product-foreground-accent transition-colors hover:bg-black/5 hover:text-product-foreground"
									onClick={reset}
									title="Clear conversation"
									type="button"
								>
									<RotateCcw className="h-4 w-4" />
								</button>
							)}
							<button
								aria-label="Minimize AI assistant"
								className="rounded-full p-2 text-product-foreground-accent transition-colors hover:bg-black/5 hover:text-product-foreground"
								onClick={() => setIsOpen(false)}
								title="Minimize, your conversation is kept"
								type="button"
							>
								<ChevronDown className="h-[18px] w-[18px]" />
							</button>
						</div>
					</header>

					<div
						className="chat-scroll flex-1 space-y-4 overflow-y-auto bg-[#fbfbfc] px-4 py-4"
						ref={scrollRef}
					>
						{isEmpty && (
							<div className="space-y-4 pt-2">
								<div className="space-y-1.5">
									<p className="font-lora-semibold text-sm font-bold text-product-foreground">
										What should we change?
									</p>
									<p className="text-[13px] leading-relaxed text-product-foreground-accent">
										Describe it in your own words - add or remove sections and
										items, rewrite text, adjust prices or restyle the whole
										catalogue. Attach or paste photos of a printed menu or price
										list and it will read them for you.
									</p>
								</div>
								<div className="space-y-2">
									<p className="font-lora-semibold text-[11px] font-bold uppercase tracking-wider text-product-foreground-accent">
										Try one of these
									</p>
									{SUGGESTIONS.map((suggestion) => (
										<button
											className="group flex w-full items-center justify-between gap-2 rounded-xl border border-product-border bg-white px-3.5 py-2.5 text-left text-[13px] text-product-foreground-accent shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-product-primary hover:bg-product-background-hover hover:text-product-foreground hover:shadow-md"
											key={suggestion}
											onClick={() => submit(suggestion)}
											type="button"
										>
											<span>{suggestion}</span>
											<ArrowUp className="h-3.5 w-3.5 shrink-0 rotate-45 text-product-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((message) => (
							<ChatMessageBubble key={message.id} message={message} />
						))}

						{plan && (
							<PlanChecklist halt={planHalt} plan={plan} running={loading} />
						)}

						{isThinking && (
							<div className="flex items-start gap-2.5">
								<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-product-border bg-white shadow-sm">
									<Sparkles className="h-3.5 w-3.5 text-product-primary" />
								</span>
								<div className="flex w-fit items-center gap-2.5 rounded-2xl rounded-tl-md border border-product-border bg-white px-3.5 py-2.5 text-[13px] text-product-foreground-accent shadow-sm">
									<TypingDots />
									<span>Working on it…</span>
								</div>
							</div>
						)}

						{error && (
							<div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
								<AlertCircle className="mt-px h-4 w-4 shrink-0" />
								<span>
									{errorMessage ?? "Something went wrong. Try again."}
								</span>
							</div>
						)}
					</div>

					<div className="shrink-0 border-t border-product-border bg-white px-3 pb-3 pt-3 md:pb-3">
						<ChatImageAttachments
							disabled={loading}
							images={attachments.images}
							notice={attachments.notice}
							onRemove={attachments.remove}
						/>
						<div className="flex items-end gap-2 rounded-2xl border border-product-border bg-white p-1.5 shadow-sm transition-all duration-200 focus-within:border-product-primary focus-within:shadow-[0_0_0_3px_rgba(211,175,55,0.2)]">
							<ChatAttachButton
								disabled={loading}
								onAttach={attachments.attach}
							/>
							<textarea
								className="chat-scroll max-h-32 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2.5 py-2 text-sm leading-relaxed text-product-foreground outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={loading}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Describe the change you want…"
								ref={inputRef}
								rows={1}
								value={draft}
							/>
							<button
								aria-label="Send message"
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-product-primary text-product-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:hover:scale-100"
								disabled={!canSubmit(draft)}
								onClick={() => void submit(draft)}
								type="button"
							>
								<ArrowUp className="h-[18px] w-[18px]" />
							</button>
						</div>
						<p className="mt-2 text-center text-[11px] leading-relaxed text-product-foreground-accent">
							<span className="inline-flex items-center gap-1 align-middle">
								<CornerDownLeft className="h-3 w-3" />
								Enter to send
							</span>
							<span aria-hidden="true" className="mx-1.5">
								·
							</span>
							Changes apply to the builder - save when you're happy
						</p>
					</div>
				</div>
			)}

			<LimitsModal
				currentPlan={currentPlan}
				isOpen={showAiLimits}
				onClose={() => setShowAiLimits(false)}
				requiredPlan={requiredPlan}
				type="ai"
			/>
			<LimitsModal
				currentPlan={userData?.currentPlan}
				isOpen={contentLimitHit}
				onClose={() => setContentLimitHit(false)}
				requiredPlan={
					userData ? getRequiredPlan(userData.currentPlan, "items") : undefined
				}
				type="items"
			/>
		</>
	);
};

export default CatalogueChat;
