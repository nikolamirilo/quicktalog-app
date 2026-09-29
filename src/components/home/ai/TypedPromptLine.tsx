"use client";

import type { Ref } from "react";

import { useTypewriter } from "@/hooks/useTypewriter";

/**
 * The typed-out prompt. Its per-character state lives here, so typing only
 * re-renders this line. Screen readers get the full text from the parent.
 */
export function TypedPromptLine({
	text,
	typing,
	onDone,
	lineRef,
}: {
	text: string;
	typing: boolean;
	onDone: () => void;
	lineRef: Ref<HTMLParagraphElement>;
}) {
	const typed = useTypewriter(text, typing, onDone);

	return (
		<p
			aria-hidden="true"
			className="mt-2.5 min-h-[3.1em] text-[16.5px] leading-[1.55] text-white"
			ref={lineRef}
		>
			{typed}
			<span className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-product-primary align-[-0.18em]" />
		</p>
	);
}
