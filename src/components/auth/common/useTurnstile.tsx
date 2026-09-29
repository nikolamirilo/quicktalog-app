"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** Cloudflare's "flexible" widget can't shrink below this width. */
const FLEXIBLE_MIN_WIDTH = 300;

/**
 * One captcha widget per form. The token is single-use, so every submit resets
 * it - a second attempt with a spent token is rejected by GoTrue.
 *
 * With no site key configured the widget is absent and `pending` is false, so
 * local development is not blocked by it.
 */
export function useTurnstile() {
	const widget = useRef<TurnstileInstance | undefined>(undefined);
	const [token, setToken] = useState<string | null>(null);
	const box = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<"flexible" | "compact">("flexible");

	useEffect(() => {
		const el = box.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(([entry]) =>
			setSize(
				entry.contentRect.width < FLEXIBLE_MIN_WIDTH ? "compact" : "flexible",
			),
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return {
		token,
		/** True when a widget is configured but has not produced a token yet. */
		pending: Boolean(SITE_KEY) && !token,
		reset: () => {
			setToken(null);
			widget.current?.reset();
		},
		element: SITE_KEY ? (
			<div className="min-w-0" ref={box}>
				<Turnstile
					// Cloudflare injects a fixed-width iframe into its full-width wrapper.
					className="[&_iframe]:!w-full"
					// The widget size is fixed at render, so a new size needs a new widget.
					key={size}
					onError={() => setToken(null)}
					onExpire={() => setToken(null)}
					onSuccess={setToken}
					options={{ theme: "light", size }}
					ref={widget}
					siteKey={SITE_KEY}
				/>
			</div>
		) : null,
	};
}
