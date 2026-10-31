"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { ProductMessage } from "@/components/manual/Messages";

export interface MessageGroup {
	area: string;
	messages: ProductMessage[];
}

const normalise = (value: string) =>
	value.toLowerCase().replace(/[^a-z0-9 ]/g, " ");

/**
 * Every message in one filterable list. Readers arrive here holding an exact
 * message, so typing any part of it is faster than reading down the page.
 */
export function MessageFinder({ groups }: { groups: MessageGroup[] }) {
	const [query, setQuery] = useState("");

	const total = groups.reduce((sum, group) => sum + group.messages.length, 0);

	const results = useMemo(() => {
		const terms = normalise(query).split(/\s+/).filter(Boolean);
		if (terms.length === 0) return groups;
		return groups
			.map((group) => ({
				area: group.area,
				messages: group.messages.filter((message) => {
					const haystack = normalise(
						`${message.text} ${group.area} ${typeof message.fix === "string" ? message.fix : ""}`,
					);
					return terms.every((term) => haystack.includes(term));
				}),
			}))
			.filter((group) => group.messages.length > 0);
	}, [groups, query]);

	const found = results.reduce((sum, group) => sum + group.messages.length, 0);

	return (
		<div>
			<div className="flex items-center gap-2.5 rounded-[14px] border border-product-border bg-product-card px-3.5 py-3">
				<Search
					aria-hidden="true"
					className="h-4 w-4 flex-none text-product-muted"
				/>
				<input
					aria-label="Filter messages"
					className="w-full bg-transparent text-[15px] text-product-foreground outline-none placeholder:text-product-muted"
					onChange={(event) => setQuery(event.target.value)}
					placeholder={`Type part of the message, such as "heading" or "SVG"`}
					type="search"
					value={query}
				/>
				<span className="flex-none text-[12.5px] tabular-nums text-product-muted">
					{query ? `${found} of ${total}` : total}
				</span>
			</div>

			{found === 0 ? (
				<p className="mt-4 rounded-product-card border border-product-border bg-product-card p-5 text-[15px] text-product-foreground-accent">
					No message here matches that. Try a single distinctive word from it,
					or use the Support tab on your dashboard.
				</p>
			) : null}

			{results.map((group) => (
				<section className="mt-6" key={group.area}>
					<h3 className="font-product-heading text-[15px] font-bold text-product-foreground">
						{group.area}
					</h3>
					<ul className="mt-2.5 grid gap-2.5">
						{group.messages.map((message) => (
							<li
								className="rounded-product-card border border-product-border bg-product-card p-4"
								key={message.text}
							>
								<q className="font-semibold text-product-foreground">
									{message.text}
								</q>
								<div className="mt-2 grid gap-2 text-[14.5px] leading-[1.6] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-5">
									<p className="text-product-foreground-accent">
										<span className="mr-1.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-product-muted">
											Why
										</span>
										{message.cause}
									</p>
									<p className="text-product-foreground-accent">
										<span className="mr-1.5 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-product-muted">
											Fix
										</span>
										{message.fix}
									</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
