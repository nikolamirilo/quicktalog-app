"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { IconTile } from "@/components/general/IconTile";

/**
 * The white card every auth screen sits in. `tabs` is the sign-in /
 * create-account switch; the single-purpose screens leave it out.
 */
export function AuthCard({
	tabs,
	children,
}: {
	tabs?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="w-full max-w-[460px] rounded-product-card border border-product-border bg-product-card px-4 pb-[30px] min-[400px]:px-[22px] pt-7 shadow-[0_1px_2px_rgba(22,20,15,0.04),0_24px_60px_-28px_rgba(22,20,15,0.28),0_8px_24px_-12px_rgba(22,20,15,0.08)] min-[480px]:px-10 min-[480px]:pb-[42px] min-[480px]:pt-10">
			{tabs ? <div className="mb-[26px]">{tabs}</div> : null}
			{children}
		</div>
	);
}

/**
 * The card's heading. `badge` is the icon the single-purpose screens show
 * above the title (key, lock, shield).
 *
 * `focusOnMount` is for a view that replaces another in place (an error, or
 * the form again after "Start over"): the heading block takes focus, so a
 * screen reader announces the new title and message and keyboard users carry
 * on from here instead of from a button that no longer exists.
 */
export function AuthHeader({
	badge,
	title,
	subtitle,
	focusOnMount = false,
}: {
	badge?: ReactNode;
	title: string;
	/** Rich content is allowed: some screens name the account in bold. */
	subtitle?: ReactNode;
	focusOnMount?: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const titleId = useId();
	const subtitleId = useId();

	useEffect(() => {
		if (focusOnMount) ref.current?.focus();
	}, [focusOnMount]);

	return (
		<div
			aria-describedby={focusOnMount && subtitle ? subtitleId : undefined}
			aria-labelledby={focusOnMount ? titleId : undefined}
			className={focusOnMount ? "rounded-2xl" : undefined}
			ref={ref}
			role={focusOnMount ? "group" : undefined}
			tabIndex={focusOnMount ? -1 : undefined}
		>
			{badge ? (
				<IconTile className="mb-[18px]" size="lg">
					{badge}
				</IconTile>
			) : null}
			<h1
				className="text-[clamp(26px,3.2vw,32px)] font-extrabold leading-[1.1] tracking-[-0.03em]"
				id={titleId}
			>
				{title}
			</h1>
			{subtitle ? (
				<p
					className="mt-2 text-[15.5px] leading-[1.55] text-product-foreground-accent"
					id={subtitleId}
				>
					{subtitle}
				</p>
			) : null}
		</div>
	);
}

/** Bold inline value inside a subtitle, such as the email address. */
export function AuthEmphasis({ children }: { children: ReactNode }) {
	return (
		<b className="break-words font-semibold text-product-foreground">
			{children}
		</b>
	);
}
