"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import type { OperationLimits } from "@/helpers/catalogueOperations";
import { useAiAssist } from "@/hooks/useAiAssist";
import { chatEditCatalogue } from "@/server_actions/ai";
import type {
	CatalogueChatHistoryMessage,
	CatalogueChatMessage,
} from "@/types/ai";
import type { UserData } from "@quicktalog/common";
import { useState } from "react";

/** How many earlier turns travel back to the model for context. */
const HISTORY_TURNS = 8;

/**
 * Drives the builder's AI chat: sends one message with the current (including
 * unsaved) catalogue as context, then applies the edits the model returns to
 * `CatalogueContext`. Nothing is persisted — the user reviews the result and
 * saves with the normal builder actions.
 *
 * Quota gating, metering and the AI LimitsModal come from `useAiAssist`; the
 * plan's section/item ceilings are enforced while the edits are applied.
 */
export function useCatalogueChat(userData?: UserData) {
	const context = useCatalogueContext();
	const ai = useAiAssist();
	const [messages, setMessages] = useState<CatalogueChatMessage[]>([]);
	const [contentLimitHit, setContentLimitHit] = useState(false);

	const append = (message: Omit<CatalogueChatMessage, "id">) => {
		setMessages((prev) => [...prev, { ...message, id: crypto.randomUUID() }]);
	};

	const limits: OperationLimits = {
		sections: userData?.currentPlan?.features?.sections_per_catalogue,
		items: userData?.currentPlan?.features?.items_per_catalogue,
		sectionTypes: userData?.currentPlan?.features?.sections,
	};

	const send = async (input: string) => {
		const message = input.trim();
		if (!message || ai.loading || !context?.catalogue?.name) return;

		const history: CatalogueChatHistoryMessage[] = messages
			.slice(-HISTORY_TURNS)
			.map(({ role, content }) => ({ role, content }));

		append({ role: "user", content: message });

		// `ai.error` is state, so it is still stale right after `run` resolves;
		// the callback hands us this turn's message synchronously.
		const failure: { message?: string } = {};
		const turn = await ai.run(
			() =>
				chatEditCatalogue(context.catalogue.name, {
					message,
					catalogue: context.catalogue,
					history,
				}),
			{
				onError: (reason) => {
					failure.message = reason;
				},
			},
		);

		if (!turn) {
			// `run` already routed quota errors to the LimitsModal; anything else
			// belongs in the transcript so the conversation still reads correctly.
			if (failure.message)
				append({ role: "assistant", content: failure.message });
			return;
		}

		const outcome =
			turn.operations.length > 0
				? context.applyOperations(turn.operations, limits)
				: null;

		if (outcome?.limitReached) setContentLimitHit(true);

		append({
			role: "assistant",
			content: turn.reply,
			changes: outcome?.applied,
			skipped: outcome?.skipped,
		});
	};

	const reset = () => {
		setMessages([]);
		ai.setError(null);
	};

	return {
		messages,
		send,
		reset,
		loading: ai.loading,
		showAiLimits: ai.showLimits,
		setShowAiLimits: ai.setShowLimits,
		currentPlan: ai.currentPlan,
		requiredPlan: ai.requiredPlan,
		contentLimitHit,
		setContentLimitHit,
	};
}
