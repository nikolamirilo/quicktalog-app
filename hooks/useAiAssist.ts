"use client";
import { useUserContext } from "@/context/UserContext";
import { getRequiredPlan } from "@/helpers/client";
import type { AiActionResult } from "@/types/ai";
import type { PricingPlan } from "@quicktalog/common";
import { useState } from "react";

/**
 * Shared plumbing for block-level AI assists (paste-a-list, generate-category,
 * item description). Runs the client-side `ai_prompts` gate before calling a
 * server action, surfaces loading/error state, opens the AI LimitsModal when
 * the quota is spent, and refreshes usage after a successful metered call.
 *
 * Render the LimitsModal from the consuming component:
 *   <LimitsModal isOpen={showLimits} onClose={() => setShowLimits(false)}
 *     currentPlan={currentPlan} requiredPlan={requiredPlan} type="ai" />
 */
export function useAiAssist() {
	const { userData, refreshUserData } = useUserContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showLimits, setShowLimits] = useState(false);

	const isOverLimit = (): boolean => {
		const limit = userData?.currentPlan?.features?.ai_prompts;
		const used = userData?.usage?.prompts ?? 0;
		return typeof limit === "number" && used >= limit;
	};

	async function run<T>(
		action: () => Promise<AiActionResult<T>>,
		opts?: { onError?: (message: string) => void },
	): Promise<T | null> {
		setError(null);
		if (isOverLimit()) {
			setShowLimits(true);
			return null;
		}
		setLoading(true);
		try {
			const res = await action();
			if (!res.success) {
				if (res.code === "limit") {
					setShowLimits(true);
				} else {
					const message = res.error ?? "Something went wrong.";
					setError(message);
					opts?.onError?.(message);
				}
				return null;
			}
			// Usage was metered server-side; refresh so the gate stays accurate.
			void refreshUserData();
			return (res.data ?? null) as T | null;
		} catch {
			const message = "Something went wrong. Try again.";
			setError(message);
			opts?.onError?.(message);
			return null;
		} finally {
			setLoading(false);
		}
	}

	const currentPlan: PricingPlan | undefined = userData?.currentPlan;
	const requiredPlan = currentPlan
		? getRequiredPlan(currentPlan, "ai")
		: undefined;

	return {
		run,
		loading,
		error,
		setError,
		showLimits,
		setShowLimits,
		currentPlan,
		requiredPlan,
	};
}
