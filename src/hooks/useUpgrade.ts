"use client";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Goes to pricing without losing the builder draft: saves it first, and when
 * the save is refused (for example, the draft is over the plan) opens pricing
 * in a new tab so this one keeps the work.
 */
export function useUpgrade(): () => Promise<void> {
	const router = useRouter();
	const save = useSaveDraft();

	return async () => {
		const result = await save();
		if (result.ok) {
			router.push("/pricing");
			return;
		}
		toast.error(
			`${result.error ?? "Could not save your changes"}. Your changes are still here.`,
		);
		window.open("/pricing", "_blank", "noopener");
	};
}
