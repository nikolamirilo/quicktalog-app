"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * One captcha widget per form. The token is single-use, so every submit resets
 * it — a second attempt with a spent token is rejected by GoTrue.
 *
 * With no site key configured the widget is absent and `pending` is false, so
 * local development is not blocked by it.
 */
export default function useTurnstile() {
	const widget = useRef<TurnstileInstance | undefined>(undefined);
	const [token, setToken] = useState<string | null>(null);

	return {
		token,
		/** True when a widget is configured but has not produced a token yet. */
		pending: Boolean(SITE_KEY) && !token,
		reset: () => {
			setToken(null);
			widget.current?.reset();
		},
		element: SITE_KEY ? (
			<Turnstile
				// Cloudflare injects a fixed-width iframe into its full-width wrapper.
				className="[&_iframe]:!w-full"
				onError={() => setToken(null)}
				onExpire={() => setToken(null)}
				onSuccess={setToken}
				options={{ theme: "auto", size: "flexible" }}
				ref={widget}
				siteKey={SITE_KEY}
			/>
		) : null,
	};
}
