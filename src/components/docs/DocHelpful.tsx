"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { TextLink } from "@/components/general/TextLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

type Vote = "yes" | "no" | null;

/**
 * "Was this helpful?" widget at the foot of a doc. Visual only for now: the
 * answer is kept in component state and not stored or sent anywhere.
 */
export function DocHelpful() {
	const [vote, setVote] = useState<Vote>(null);

	const option = (value: Exclude<Vote, null>, label: string) => (
		<Button
			aria-pressed={vote === value}
			className={cn(
				vote === value &&
					"border-product-primary bg-product-primary text-product-foreground hover:border-product-primary hover:bg-product-primary",
			)}
			onClick={() => setVote(value)}
			size="sm"
			type="button"
			variant="secondary"
		>
			{value === "yes" ? (
				<ThumbsUp aria-hidden="true" />
			) : (
				<ThumbsDown aria-hidden="true" />
			)}
			{label}
		</Button>
	);

	return (
		<div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[18px] border border-product-border bg-product-background-hero px-5 py-[18px]">
			<p className="font-product-heading text-[16.5px] font-bold leading-[1.3] text-product-foreground">
				Was this helpful?
			</p>
			<div className="flex gap-2">
				{option("yes", "Yes")}
				{option("no", "No")}
			</div>
			<p
				aria-live="polite"
				className="basis-full text-[14.5px] text-product-foreground-accent empty:sr-only"
				role="status"
			>
				{vote === "yes" && "Thanks for letting us know. Glad it helped."}
				{vote === "no" && (
					<>
						Sorry about that.{" "}
						<TextLink href="/contact">Tell us what was missing</TextLink> and we
						will improve this page.
					</>
				)}
			</p>
		</div>
	);
}
