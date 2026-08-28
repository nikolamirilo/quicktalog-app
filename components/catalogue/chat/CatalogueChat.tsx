"use client";
import ChatMessageBubble from "@/components/catalogue/chat/ChatMessageBubble";
import LimitsModal from "@/components/modals/LimitsModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getRequiredPlan } from "@/helpers/client";
import { useCatalogueChat } from "@/hooks/useCatalogueChat";
import type { UserData } from "@quicktalog/common";
import { Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
	"Add a Desserts section with 5 items",
	"Make every description shorter and friendlier",
	"Raise all prices in the first section by 10%",
	"Switch the theme to something more elegant",
];

/**
 * Floating AI assistant for the catalogue builder. Edits land in
 * `CatalogueContext` straight away; the user still saves or publishes with the
 * normal builder actions.
 */
const CatalogueChat = ({ userData }: { userData?: UserData }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [draft, setDraft] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const {
		messages,
		send,
		reset,
		loading,
		showAiLimits,
		setShowAiLimits,
		currentPlan,
		requiredPlan,
		contentLimitHit,
		setContentLimitHit,
	} = useCatalogueChat(userData);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [messages, loading]);

	const submit = async (text: string) => {
		if (!text.trim() || loading) return;
		setDraft("");
		await send(text);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void submit(draft);
		}
	};

	return (
		<>
			{!isOpen && (
				<button
					aria-label="Open AI assistant"
					className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[49] flex items-center gap-2 rounded-full bg-product-primary py-3 pl-4 pr-5 text-sm font-medium text-product-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
					onClick={() => setIsOpen(true)}
					type="button"
				>
					<Sparkles className="h-4 w-4 shrink-0" />
					<span>Ask AI</span>
				</button>
			)}

			{isOpen && (
				<div className="fixed inset-x-3 bottom-20 z-[60] flex h-[70dvh] flex-col overflow-hidden rounded-2xl border border-product-border bg-white shadow-2xl md:inset-x-auto md:bottom-6 md:left-6 md:h-[560px] md:w-[400px]">
					<div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
						<div className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-product-primary" />
							<div>
								<p className="text-sm font-semibold text-gray-900">
									AI assistant
								</p>
								<p className="text-xs text-gray-500">
									Ask for any change to this catalogue
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1">
							{messages.length > 0 && (
								<button
									aria-label="Clear conversation"
									className="rounded-full p-2 transition-colors hover:bg-gray-100"
									onClick={reset}
									type="button"
								>
									<RotateCcw className="h-4 w-4 text-gray-400" />
								</button>
							)}
							<button
								aria-label="Close AI assistant"
								className="rounded-full p-2 transition-colors hover:bg-gray-100"
								onClick={() => setIsOpen(false)}
								type="button"
							>
								<X className="h-5 w-5 text-gray-400" />
							</button>
						</div>
					</div>

					<div
						className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
						ref={scrollRef}
					>
						{messages.length === 0 && !loading && (
							<div className="space-y-3">
								<p className="text-sm text-gray-500">
									Describe what you want and I'll edit the catalogue for you -
									add or remove sections and items, rewrite text, change prices
									or restyle it.
								</p>
								<div className="flex flex-col gap-2">
									{SUGGESTIONS.map((suggestion) => (
										<button
											className="rounded-xl border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:border-product-primary hover:bg-gray-50"
											key={suggestion}
											onClick={() => void submit(suggestion)}
											type="button"
										>
											{suggestion}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((message) => (
							<ChatMessageBubble key={message.id} message={message} />
						))}

						{loading && (
							<div className="flex items-center gap-2 text-sm text-gray-500">
								<Loader2 className="h-4 w-4 animate-spin text-product-primary" />
								Working on it...
							</div>
						)}
					</div>

					<div className="shrink-0 border-t border-gray-100 p-3">
						<div className="flex items-center gap-2">
							<Textarea
								className="max-h-32 min-h-[44px] resize-none text-sm"
								disabled={loading}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Add a Drinks section with 6 items..."
								value={draft}
							/>
							<Button
								aria-label="Send message"
								className="h-11 w-11 shrink-0 p-0"
								disabled={loading || !draft.trim()}
								onClick={() => void submit(draft)}
								size="icon"
							>
								{loading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
							</Button>
						</div>
						<p className="mt-2 text-[11px] text-gray-400">
							Changes apply to the builder - save or publish when you're happy.
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
