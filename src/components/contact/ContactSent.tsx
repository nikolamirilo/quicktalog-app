"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { SentMessage } from "@/hooks/useContactSubmit";
import { cn } from "@/lib/ui/cn";

/** Thank-you panel shown after a message is sent; takes focus so it is announced. */
export function ContactSent({
	sent,
	onReset,
	compact = false,
}: {
	sent: SentMessage;
	onReset: () => void;
	/** Dashboard card: smaller icon and an h3 under the card title. */
	compact?: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const Heading = compact ? "h3" : "h2";

	useEffect(() => {
		ref.current?.focus();
	}, []);

	return (
		<div
			aria-live="polite"
			className={cn(
				"flex flex-col items-center gap-2.5 px-2 text-center focus:outline-none",
				compact ? "py-6" : "py-7",
			)}
			ref={ref}
			role="status"
			tabIndex={-1}
		>
			<span
				className={cn(
					"mb-2 grid place-items-center rounded-full bg-product-success-soft text-product-success shadow-[0_0_0_8px_rgb(var(--product-success-bright-rgb)/0.08)]",
					compact ? "h-12 w-12" : "h-16 w-16",
				)}
			>
				<Check
					aria-hidden="true"
					className={compact ? "h-6 w-6" : "h-[30px] w-[30px]"}
					strokeWidth={2.6}
				/>
			</span>
			<Heading
				className={cn(
					compact ? "text-xl font-bold tracking-[-0.02em]" : "text-title-lg",
				)}
			>
				Thanks, your message is on its way!
			</Heading>
			<p
				className={cn(
					"max-w-[44ch] text-product-foreground-accent",
					compact && "text-sm",
				)}
			>
				Thanks, {sent.firstName}. We've received your message about "
				{sent.subject}" and will reply to {sent.email} within 1 business day.
			</p>
			<Button
				className="mt-2.5"
				onClick={onReset}
				size={compact ? "sm" : "default"}
				variant="outline"
			>
				Send another message
			</Button>
		</div>
	);
}
