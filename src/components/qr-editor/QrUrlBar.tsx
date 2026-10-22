"use client";

import { Check, Copy, Globe, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/ui/cn";

export function QrUrlBar({ url }: { url: string }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 1800);
		return () => clearTimeout(timer);
	}, [copied]);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			toast.error("Could not copy the link. Select it and copy it instead.");
		}
	};

	return (
		<div>
			<div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-product-border bg-product-card py-1.5 pl-3.5 pr-1.5 shadow-product">
				<Globe
					aria-hidden="true"
					className="h-[17px] w-[17px] shrink-0 text-product-muted"
				/>
				<a
					className="min-w-0 flex-1 truncate rounded-md font-mono text-[13.5px] font-medium text-product-foreground underline-offset-[3px] hover:underline"
					href={url}
					rel="noopener"
					target="_blank"
				>
					{url.replace(/^https?:\/\/(www\.)?/, "")}
				</a>
				<button
					className={cn(
						"inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[11px] border border-product-border-strong bg-product-background px-[13px] text-[13px] font-semibold text-product-foreground transition-colors hover:border-product-primary hover:bg-product-primary-soft",
						copied &&
							"border-product-success/35 bg-product-success-soft text-product-success hover:border-product-success/35 hover:bg-product-success-soft",
					)}
					onClick={copy}
					type="button"
				>
					{copied ? (
						<Check aria-hidden="true" className="h-[15px] w-[15px]" />
					) : (
						<Copy aria-hidden="true" className="h-[15px] w-[15px]" />
					)}
					<span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
				</button>
			</div>
			<p className="mx-1 mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-product-muted">
				<Info aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
				This QR code links to your catalog. The URL cannot be changed.
			</p>
		</div>
	);
}
