"use client";
import type { CatalogueAgentUIMessage } from "@/agent";
import ChatImageAttachments, {
	ChatAttachButton,
} from "@/components/catalogue/chat/ChatImageAttachments";
import ChatMessageBubble, {
	AssistantAvatar,
} from "@/components/catalogue/chat/ChatMessageBubble";
import CreditMeter from "@/components/catalogue/chat/CreditMeter";
import PlanChecklist from "@/components/catalogue/chat/PlanChecklist";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { QuickAiMark } from "@/components/catalogue/chat/QuickAiMark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { useCatalogueChat } from "@/hooks/useCatalogueChat";
import { usePastedImages } from "@/hooks/usePastedImages";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { cn } from "@/lib/ui/cn";
import type { UserData } from "@quicktalog/common";
import { isToolUIPart } from "ai";
import {
	AlertCircle,
	ArrowUp,
	ChevronDown,
	CornerDownLeft,
	RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Deliberately industry-neutral (a cuisine-specific suggestion reads as "not for me" to everyone else); each exercises a different tool group. */
const SUGGESTIONS = [
	"Add a new section with 6 items",
	"Make every description shorter and friendlier",
	"Raise every price by 10%",
	"Switch the theme to something more elegant",
];

/** The panel's id, for `aria-controls` on whatever opens it (the rail, the phone bar). */
export const CHAT_PANEL_ID = "builder-ai-chat";

/** Below `md` the chat is a full-height sheet that has to stay above the on-screen keyboard. */
const PHONE_QUERY = "(max-width: 719.98px)";

/** 44px touch targets on a phone, a denser 36px row from `md`. */
const headerButtonClass =
	"h-11 w-11 hover:text-product-foreground md:h-9 md:w-9 [&_svg]:size-[18px]";

/** Three-dot "thinking" indicator shown while the agent works. */
const TypingDots = () => (
	<span aria-hidden="true" className="flex items-center gap-1">
		{[0, 150, 300].map((delay) => (
			<span
				className="h-1.5 w-1.5 animate-bounce rounded-full bg-product-primary motion-reduce:animate-none"
				key={delay}
				style={{ animationDelay: `${delay}ms` }}
			/>
		))}
	</span>
);

/** What the assistant said in a turn, as plain text for the screen-reader announcement. */
const spokenText = (message?: CatalogueAgentUIMessage): string =>
	message?.role === "assistant"
		? message.parts
				.flatMap((part) => (part.type === "text" ? [part.text] : []))
				.join(" ")
				.trim()
		: "";

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
 * Quick AI, the assistant in the catalogue builder: a floating panel from `md`, a
 * full-height sheet on a phone. Edits land in `CatalogueContext` immediately;
 * the user still saves/publishes normally. On desktop it opens from the "Quick AI"
 * pill bottom-left; on a phone from the bottom bar (`isChatOpen` in the context).
 * Pinned to the product font rather than inherited, since the builder writes
 * the catalogue's own theme font onto `documentElement` and this panel is
 * product chrome, not catalogue content.
 */
const CatalogueChat = ({
	userData: initialUserData,
}: {
	userData?: UserData;
}) => {
	// The prop is rendered once by the server component that owns this page, so it
	// never reflects a charge made during the session. The context is the live copy.
	const { userData: liveUserData } = useUserContext();
	const userData = liveUserData ?? initialUserData;
	const creditLimit = userData?.currentPlan?.features?.ai_credits;
	const context = useCatalogueContext();
	const isOpen = context?.isChatOpen ?? false;
	const setIsOpen = context?.setIsChatOpen;
	const [draft, setDraft] = useState("");
	const [announcement, setAnnouncement] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const panelRef = useRef<HTMLElement>(null);
	/** Whatever had focus when the chat opened (the rail or bar button), to hand focus back on close. */
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const wasLoading = useRef(false);
	const keyboardBox = useVisualViewport(isOpen, PHONE_QUERY);
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

	// Move focus into the chat when it opens: the composer from `md`, the panel
	// itself on a phone (focusing the field there would throw up the keyboard).
	useEffect(() => {
		if (!isOpen) return;
		returnFocusRef.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		if (window.matchMedia(PHONE_QUERY).matches) panelRef.current?.focus();
		else inputRef.current?.focus();
		return () => {
			const target = returnFocusRef.current;
			if (target?.isConnected) target.focus();
		};
	}, [isOpen]);

	// One announcement per turn: "working" when it starts, the reply once it ends.
	useEffect(() => {
		if (loading && !wasLoading.current) setAnnouncement("Working on it…");
		if (!loading && wasLoading.current && !error) {
			setAnnouncement(
				spokenText(messages[messages.length - 1]) || "The assistant is done.",
			);
		}
		wasLoading.current = loading;
	}, [loading, messages, error]);

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

	const close = () => setIsOpen?.(false);

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
			<Button
				aria-controls={isOpen ? CHAT_PANEL_ID : undefined}
				aria-expanded={isOpen}
				className={cn(
					"fixed bottom-6 left-6 z-[1040] hidden font-product-body shadow-product-primary md:inline-flex",
					isOpen && "md:invisible",
				)}
				onClick={() => setIsOpen?.(true)}
			>
				<QuickAiMark className="size-[1.2em]" />
				Quick AI
			</Button>
			{isOpen && (
				<>
					{/* Phone only: the sheet covers the page, so a tap outside it minimizes. */}
					<div
						aria-hidden="true"
						className="fixed inset-0 z-[1049] animate-in bg-product-dark/40 duration-300 fade-in motion-reduce:animate-none md:hidden"
						onClick={close}
					/>
					<section
						aria-labelledby={`${CHAT_PANEL_ID}-title`}
						className={cn(
							"fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[1050] flex animate-in flex-col overflow-hidden rounded-t-[24px] border border-product-border bg-product-card font-product-body text-product-foreground shadow-product-hover outline-none duration-300 fade-in slide-in-from-bottom-6 motion-reduce:animate-none",
							// Desktop: a floating panel bottom-left, clear of the 72px rail, never taller than the viewport.
							"md:inset-x-auto md:bottom-6 md:left-6 md:top-auto md:h-[min(640px,calc(100dvh-3rem))] md:w-[min(420px,calc(100vw-72px-3rem))] md:rounded-product-card",
						)}
						id={CHAT_PANEL_ID}
						onKeyDown={(event) => {
							if (event.key === "Escape" && !event.defaultPrevented) close();
						}}
						ref={panelRef}
						role="dialog"
						style={
							keyboardBox
								? {
										top: `calc(${keyboardBox.top}px + env(safe-area-inset-top) + 0.5rem)`,
										bottom: "auto",
										height: `calc(${keyboardBox.height}px - env(safe-area-inset-top) - 0.5rem)`,
									}
								: undefined
						}
						tabIndex={-1}
					>
						<header className="flex shrink-0 items-center justify-between gap-2 border-b border-product-border bg-product-card py-2.5 pl-4 pr-2 md:py-2">
							<div className="flex min-w-0 items-center gap-3">
								<span
									aria-hidden="true"
									className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-product-foreground"
								>
									<QuickAiMark className="size-5" variant="gradient" />
								</span>
								<div className="min-w-0">
									<h2
										className="truncate font-product-heading text-[15px] font-bold leading-tight text-product-foreground"
										id={`${CHAT_PANEL_ID}-title`}
									>
										Quick AI
									</h2>
									<p className="truncate text-xs leading-tight text-product-muted">
										Ask for any change to this catalogue
									</p>
								</div>
							</div>
							<div className="flex shrink-0 items-center">
								{typeof creditLimit === "number" && (
									<CreditMeter
										limit={creditLimit}
										used={userData?.usage?.credits ?? 0}
									/>
								)}
								{messages.length > 0 && (
									<Button
										aria-label="Clear conversation"
										className={headerButtonClass}
										onClick={reset}
										size="icon"
										title="Clear conversation"
										variant="ghost"
									>
										<RotateCcw />
									</Button>
								)}
								<Button
									aria-label="Minimize Quick AI"
									className={headerButtonClass}
									onClick={close}
									size="icon"
									title="Minimize, your conversation is kept"
									variant="ghost"
								>
									<ChevronDown />
								</Button>
							</div>
						</header>

						<div
							className="chat-scroll flex-1 space-y-4 overflow-y-auto overscroll-contain bg-product-background px-4 py-4"
							ref={scrollRef}
						>
							{isEmpty && (
								<div className="space-y-5 pt-1">
									<div className="space-y-1.5">
										<h3 className="font-product-heading text-base font-extrabold leading-tight text-product-foreground">
											What should we change?
										</h3>
										<p className="text-sm leading-relaxed text-product-foreground-accent">
											Describe it in your own words - add or remove sections and
											items, rewrite text, adjust prices or restyle the whole
											catalogue. Attach or paste photos of a printed menu or
											price list and it will read them for you.
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-xs font-semibold uppercase tracking-[0.08em] text-product-muted">
											Try one of these
										</p>
										<ul className="space-y-2">
											{SUGGESTIONS.map((suggestion) => (
												<li key={suggestion}>
													<button
														className="group flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-product-border bg-product-card px-3.5 py-2.5 text-left text-sm font-medium text-product-foreground transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-product-primary hover:bg-product-primary-soft disabled:pointer-events-none disabled:opacity-50 motion-reduce:hover:translate-y-0"
														disabled={loading || attachments.scanning}
														onClick={() => submit(suggestion)}
														type="button"
													>
														<ArrowUp
															aria-hidden="true"
															className="h-4 w-4 shrink-0 text-product-primary-ink"
														/>
														<span>{suggestion}</span>
													</button>
												</li>
											))}
										</ul>
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
									<AssistantAvatar />
									<div className="flex w-fit items-center gap-2.5 rounded-[18px] rounded-tl-md border border-product-border bg-product-card px-3.5 py-2.5 text-sm text-product-foreground-accent">
										<TypingDots />
										<span>Working on it…</span>
									</div>
								</div>
							)}

							{error && (
								<div
									className="flex items-start gap-2 rounded-xl border border-product-error/20 bg-product-error-soft px-3 py-2.5 text-sm leading-snug text-product-error-ink"
									role="alert"
								>
									<AlertCircle
										aria-hidden="true"
										className="mt-px h-4 w-4 shrink-0"
									/>
									<span>
										{errorMessage ?? "Something went wrong. Try again."}
									</span>
								</div>
							)}
						</div>

						{/* Announces each finished assistant turn; the log itself re-renders on every streamed chunk, which would be read out piecemeal. */}
						<p aria-live="polite" className="sr-only" role="status">
							{announcement}
						</p>

						<div className="shrink-0 border-t border-product-border bg-product-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:pb-3">
							<ChatImageAttachments
								disabled={loading}
								images={attachments.images}
								notice={attachments.notice}
								onRemove={attachments.remove}
							/>
							<div className="flex items-end gap-1.5 rounded-2xl border-[1.5px] border-product-border-strong bg-product-card p-1.5 transition-[border-color,box-shadow] duration-200 focus-within:border-product-primary focus-within:ring-4 focus-within:ring-product-primary/25 hover:border-product-border-hover focus-within:hover:border-product-primary">
								<ChatAttachButton
									disabled={loading}
									onAttach={attachments.attach}
								/>
								<Textarea
									aria-label="Message Quick AI"
									className="chat-scroll max-h-32 min-h-0 min-w-0 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-1.5 py-2.5 hover:border-0 focus-visible:border-0 focus-visible:ring-0 md:py-2.5"
									disabled={loading}
									onChange={(event) => setDraft(event.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="Describe the change you want…"
									ref={inputRef}
									rows={1}
									value={draft}
								/>
								<Button
									aria-label="Send message"
									className="h-11 w-11 shrink-0 shadow-none hover:translate-y-0 hover:shadow-none md:h-10 md:w-10"
									disabled={!canSubmit(draft)}
									onClick={() => submit(draft)}
									size="icon"
								>
									<ArrowUp />
								</Button>
							</div>
							<p className="mt-2 text-center text-[11px] leading-relaxed text-product-muted">
								<span className="hidden items-center gap-1 align-middle md:inline-flex">
									<CornerDownLeft aria-hidden="true" className="h-3 w-3" />
									Enter to send
									<span aria-hidden="true" className="mx-1.5">
										·
									</span>
								</span>
								Changes apply to the builder - save when you're happy
							</p>
						</div>
					</section>
				</>
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
