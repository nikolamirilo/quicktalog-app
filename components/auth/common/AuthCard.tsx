import type { ReactNode } from "react";

/**
 * The white card every auth screen sits in: optional mode tabs, a centred
 * heading, then whatever the screen asks for.
 */
export default function AuthCard({
	tabs,
	title,
	subtitle,
	children,
}: {
	/** The sign-in / create-account switch. Absent on the single-purpose screens. */
	tabs?: ReactNode;
	title: string;
	/** Rich content is allowed: the confirm screen names the account in bold. */
	subtitle?: ReactNode;
	/** Optional: the "check your inbox" state is a heading and nothing else. */
	children?: ReactNode;
}) {
	return (
		<div className="w-full rounded-2xl border border-product-border bg-product-background p-6 shadow-sm sm:p-8">
			{tabs ? <div className="mb-7">{tabs}</div> : null}
			<h1 className="text-center text-2xl font-semibold tracking-tight text-product-foreground">
				{title}
			</h1>
			{subtitle ? (
				<p className="mt-1.5 text-center text-sm leading-relaxed text-product-foreground-accent">
					{subtitle}
				</p>
			) : null}
			{children ? <div className="mt-6">{children}</div> : null}
		</div>
	);
}
