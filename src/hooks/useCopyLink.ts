"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const COPIED_FOR_MS = 3000;

/**
 * Copies a URL to the clipboard and reports `copied` for a few seconds. Each
 * caller has its own flag, so one card's "Link Copied" never shows on another.
 */
export function useCopyLink() {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const copy = useCallback(async (url: string) => {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// Denied permission, an insecure context or no clipboard API.
			toast.error(
				"Could not copy the link. Your browser blocked the clipboard.",
			);
			return;
		}
		setCopied(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
	}, []);

	return { copied, copy };
}
