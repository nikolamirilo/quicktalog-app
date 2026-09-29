"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Types `text` out one character at a time while `enabled`, then calls
 * `onDone` after `pause` ms. When disabled it returns the full text.
 */
export function useTypewriter(
	text: string,
	enabled: boolean,
	onDone?: () => void,
	pause = 2600,
) {
	const [typed, setTyped] = useState(text);
	const onDoneRef = useRef(onDone);
	onDoneRef.current = onDone;

	useEffect(() => {
		if (!enabled) {
			setTyped(text);
			return;
		}
		let index = 0;
		let timer: ReturnType<typeof setTimeout>;
		const step = () => {
			index += 1;
			setTyped(text.slice(0, index));
			if (index < text.length) {
				timer = setTimeout(step, 22 + Math.random() * 28);
			} else {
				timer = setTimeout(() => onDoneRef.current?.(), pause);
			}
		};
		setTyped("");
		timer = setTimeout(step, 0);
		return () => clearTimeout(timer);
	}, [text, enabled, pause]);

	return typed;
}
