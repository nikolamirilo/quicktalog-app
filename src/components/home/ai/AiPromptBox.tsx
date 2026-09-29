"use client";

import { useRef } from "react";

import { TypedPromptLine } from "@/components/home/ai/TypedPromptLine";
import { aiPromptKeys, aiPrompts } from "@/constants/marketing";
import { useTypedPrompt } from "@/hooks/useTypedPrompt";

/** "Describe your business" box: the typed example prompt and its chips. */
export function AiPromptBox() {
	const lineRef = useRef<HTMLParagraphElement>(null);
	const { active, choose, advance, typing } = useTypedPrompt(
		aiPromptKeys,
		lineRef,
	);

	return (
		<div className="mt-[18px] rounded-[18px] border border-white/10 bg-product-dark-raised p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
			<div
				className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.04em] text-product-on-dark-subtle"
				id="ai-prompt-label"
			>
				Describe your business
				<b className="inline-flex items-center gap-1.5 font-semibold normal-case tracking-normal text-product-primary-bright">
					<i className="h-[7px] w-[7px] animate-pulse rounded-full bg-product-primary" />
					AI
				</b>
			</div>
			<p className="sr-only">{aiPrompts[active].text}</p>
			<TypedPromptLine
				lineRef={lineRef}
				onDone={advance}
				text={aiPrompts[active].text}
				typing={typing}
			/>
			<div
				aria-labelledby="ai-prompt-label"
				className="mt-3 flex flex-wrap gap-2"
				role="group"
			>
				{aiPromptKeys.map((key) => (
					<button
						aria-pressed={active === key}
						className="rounded-full border border-white/[0.16] px-[13px] py-2 text-[13.5px] font-semibold leading-none text-product-on-dark transition-colors hover:border-product-primary hover:text-white aria-pressed:border-product-primary aria-pressed:bg-product-primary aria-pressed:text-product-foreground"
						key={key}
						onClick={() => choose(key)}
						type="button"
					>
						{aiPrompts[key].label}
					</button>
				))}
			</div>
		</div>
	);
}
