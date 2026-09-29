"use client";

import {
	type Environments,
	initializePaddle,
	type Paddle,
} from "@paddle/paddle-js";
import { useEffect, useState } from "react";

/** Loads Paddle.js once on the client; stays undefined if it is blocked. */
export function usePaddle() {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);

	useEffect(() => {
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
	}, []);

	return paddle;
}
