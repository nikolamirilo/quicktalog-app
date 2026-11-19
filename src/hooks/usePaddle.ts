"use client";

import {
	type Environments,
	initializePaddle,
	type Paddle,
} from "@paddle/paddle-js";
import { useEffect, useState } from "react";

/**
 * Loads Paddle.js once on the client; stays undefined if it is blocked.
 *
 * `enabled` defers the script for a view that is not on screen yet - prices are
 * already server-rendered, so Paddle.js only localises the currency.
 */
export function usePaddle(enabled = true) {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);

	useEffect(() => {
		if (!enabled) return;
		if (
			process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
			process.env.NEXT_PUBLIC_PADDLE_ENV
		) {
			initializePaddle({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
			})
				.then((instance) => {
					if (instance) setPaddle(instance);
				})
				.catch(() => {
					// Paddle.js blocked (adblock/offline/region) - leave paddle
					// undefined; the checkout guard handles the click gracefully.
				});
		}
	}, [enabled]);

	return paddle;
}
