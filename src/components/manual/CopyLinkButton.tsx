"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

/** Copies the address of the page the reader is on. */
export function CopyLinkButton() {
	const [copied, setCopied] = useState(false);

	return (
		<button
			className="inline-flex items-center gap-1.5 rounded-full border border-product-border bg-product-card px-3 py-1.5 text-[12.5px] font-bold text-product-foreground-accent transition-colors hover:text-product-foreground"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(window.location.href);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				} catch {
					// Clipboard access can be refused. The address bar still has it.
				}
			}}
			type="button"
		>
			{copied ? (
				<Check
					aria-hidden="true"
					className="h-3.5 w-3.5 text-product-success"
				/>
			) : (
				<Link2 aria-hidden="true" className="h-3.5 w-3.5" />
			)}
			{copied ? "Link copied" : "Copy link"}
		</button>
	);
}
