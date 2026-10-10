"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

/**
 * The success view that replaces a form once it has done its job. It takes
 * focus when it appears, so a screen reader announces its title and message
 * and keyboard users continue from here instead of from a removed button.
 */
export function AuthDone({
	icon,
	title,
	subtitle,
	children,
}: {
	icon: ReactNode;
	title: string;
	subtitle: ReactNode;
	/** The actions: buttons, tips, the fine print. */
	children?: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const titleId = useId();
	const subtitleId = useId();

	useEffect(() => {
		ref.current?.focus();
	}, []);

	return (
		<div
			aria-describedby={subtitleId}
			aria-labelledby={titleId}
			className="rounded-2xl text-center"
			ref={ref}
			role="group"
			tabIndex={-1}
		>
			<span
				aria-hidden="true"
				className="mx-auto mb-5 mt-1.5 grid size-[68px] place-items-center rounded-full bg-product-primary text-product-foreground shadow-[0_6px_18px_-6px_rgba(245,163,0,0.55)] ring-8 ring-product-primary-soft duration-500 ease-[cubic-bezier(0.2,0.9,0.3,1.3)] animate-in zoom-in-50 [&_svg]:size-[30px] [&_svg]:stroke-[2.4]"
			>
				{icon}
			</span>
			<h1
				className="text-[clamp(26px,3.2vw,32px)] font-extrabold leading-[1.1] tracking-[-0.03em]"
				id={titleId}
			>
				{title}
			</h1>
			<p
				className="mt-2 text-[15.5px] leading-[1.55] text-product-foreground-accent"
				id={subtitleId}
			>
				{subtitle}
			</p>
			{children}
		</div>
	);
}
