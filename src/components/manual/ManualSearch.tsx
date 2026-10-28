"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { ManualSearchEntry } from "@/lib/content/manual";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const score = (entry: ManualSearchEntry, query: string) => {
	const title = entry.title.toLowerCase();
	if (title === query) return 100;
	if (title.startsWith(query)) return 80;
	if (title.includes(query)) return 60;
	if (entry.terms.includes(query)) return 40;
	const words = query.split(/\s+/).filter(Boolean);
	if (words.length > 1 && words.every((word) => entry.terms.includes(word))) {
		return 20;
	}
	return 0;
};

/**
 * Searches titles, keywords and the words readers actually type, so "menu" or
 * "price list" reach the pages the manual calls something else.
 */
export function ManualSearch({
	index,
	popular,
}: {
	index: ManualSearchEntry[];
	/** Shown while the box is empty. */
	popular: ManualSearchEntry[];
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const typing =
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.isContentEditable;
			if (typing) return;
			if (
				event.key === "/" ||
				(event.key === "k" && (event.metaKey || event.ctrlKey))
			) {
				event.preventDefault();
				setOpen(true);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const results = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return popular;
		return index
			.map((entry) => ({ entry, rank: score(entry, trimmed) }))
			.filter((hit) => hit.rank > 0)
			.sort((a, b) => b.rank - a.rank)
			.slice(0, 8)
			.map((hit) => hit.entry);
	}, [index, popular, query]);

	return (
		<>
			<button
				className="flex w-full items-center gap-2 rounded-[14px] border border-product-border bg-product-card px-3 py-2.5 text-left text-[14px] text-product-muted transition-colors hover:border-product-border-hover"
				onClick={() => setOpen(true)}
				type="button"
			>
				<Search aria-hidden="true" className="h-4 w-4" />
				Search the manual
				<kbd className="ml-auto rounded-[6px] border border-product-border-strong px-1.5 text-[11px] font-bold">
					/
				</kbd>
			</button>
			<Dialog
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setQuery("");
				}}
				open={open}
			>
				<DialogContent className="top-[12%] max-w-[560px] translate-y-0 gap-0 p-0">
					<DialogTitle className="sr-only">Search the manual</DialogTitle>
					<div className="flex items-center gap-2.5 border-b border-product-border px-4 py-3.5">
						<Search
							aria-hidden="true"
							className="h-[18px] w-[18px] flex-none text-product-muted"
						/>
						<input
							autoFocus
							className="w-full bg-transparent text-[16px] text-product-foreground outline-none placeholder:text-product-muted"
							onChange={(event) => setQuery(event.target.value)}
							placeholder="What do you want to do?"
							type="search"
							value={query}
						/>
					</div>
					<div className="max-h-[52dvh] overflow-y-auto p-2">
						{query.trim() === "" ? (
							<p className="px-2.5 py-1.5 text-xs font-bold text-product-muted">
								Most read
							</p>
						) : null}
						{results.length === 0 ? (
							<p className="px-2.5 py-6 text-center text-[14.5px] text-product-foreground-accent">
								Nothing matches that. Try a word that appears on the screen you
								are looking at.
							</p>
						) : (
							<ul>
								{results.map((entry) => (
									<li key={entry.slug}>
										<Link
											className="block rounded-xl px-2.5 py-2 transition-colors hover:bg-product-background-hero"
											href={entry.href}
											onClick={() => setOpen(false)}
										>
											<span className="block text-[11.5px] font-bold uppercase tracking-[0.03em] text-product-muted">
												{entry.group}
											</span>
											<span className="block font-semibold text-product-foreground">
												{entry.title}
											</span>
											<span className="mt-0.5 block line-clamp-2 text-[13.5px] text-product-foreground-accent">
												{entry.inShort}
											</span>
										</Link>
									</li>
								))}
							</ul>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
