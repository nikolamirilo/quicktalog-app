import type { ReactNode } from "react";

/** Dashed box showing the URL a catalogue will get (`.as-url`). */
export function UrlPreview({
	icon,
	label,
	url,
}: {
	icon: ReactNode;
	label: string;
	url: string;
}) {
	return (
		<div className="flex items-start gap-2.5 rounded-[14px] border border-dashed border-product-border-strong bg-product-background px-3.5 py-3 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:flex-none [&_svg]:text-product-muted">
			<span aria-hidden="true">{icon}</span>
			<div className="min-w-0">
				<p className="text-xs font-semibold text-product-muted">{label}</p>
				<code className="block break-all font-mono text-[13px] leading-snug text-product-foreground-accent">
					{url}
				</code>
			</div>
		</div>
	);
}
