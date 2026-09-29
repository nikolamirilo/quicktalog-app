"use client";

import { LifeBuoy, Search, X } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";

import { FilterChip } from "@/components/general/FilterChip";
import { Container } from "@/components/general/Container";
import { FaqAccordion } from "@/components/general/FaqAccordion";
import { IconTile } from "@/components/general/IconTile";
import { HeroKicker, PageHero } from "@/components/general/PageHero";
import { SectionHeading } from "@/components/general/SectionHeading";
import { textLinkClass } from "@/components/general/TextLink";
import { Button } from "@/components/ui/button";
import { helpCategoryLabels, helpPopularSearches } from "@/constants/help";
import { cn } from "@/lib/ui/cn";
import type { IFAQ, IFAQCategory } from "@/types/shared";

type Filter = IFAQCategory | "all";

/**
 * Hero search plus the filterable FAQ list. Search matches question and answer
 * text and highlights matches; the topic chips and the search combine.
 */
export function HelpCenter({ faqs }: { faqs: IFAQ[] }) {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<Filter>("all");
	const inputRef = useRef<HTMLInputElement>(null);
	const listId = useId();
	const countId = useId();

	const categories = useMemo(
		() =>
			(Object.keys(helpCategoryLabels) as IFAQCategory[])
				.map((key) => ({
					key,
					label: helpCategoryLabels[key],
					count: faqs.filter((faq) => faq.category === key).length,
				}))
				.filter((category) => category.count > 0),
		[faqs],
	);

	const needle = query.trim().toLowerCase();
	const visible = faqs.filter(
		(faq) =>
			(filter === "all" || faq.category === filter) &&
			(!needle ||
				faq.question.toLowerCase().includes(needle) ||
				faq.answer.toLowerCase().includes(needle)),
	);

	const status =
		visible.length === faqs.length
			? `Showing all ${faqs.length} questions`
			: `Showing ${visible.length} of ${faqs.length} questions`;

	const reset = () => {
		setQuery("");
		setFilter("all");
		inputRef.current?.focus();
	};

	return (
		<>
			<PageHero
				kicker={<HeroKicker icon={<LifeBuoy />}>Help Center</HeroKicker>}
				lead="Find answers to common questions, step-by-step guides, and resources to get the most out of Quicktalog."
				title="Help Center & FAQs"
			>
				<form
					className="relative mx-auto mt-7 max-w-[640px]"
					onSubmit={(event) => event.preventDefault()}
					role="search"
				>
					<label className="sr-only" htmlFor="help-search">
						Search the FAQs
					</label>
					<Search
						aria-hidden="true"
						className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-product-muted"
					/>
					<input
						aria-controls={listId}
						aria-describedby={countId}
						autoComplete="off"
						className="h-[60px] w-full appearance-none rounded-full border border-product-border-strong bg-product-card pl-[52px] pr-[54px] text-[16.5px] font-medium text-product-foreground shadow-product outline-none transition-[border-color,box-shadow] placeholder:text-product-muted focus:border-product-primary focus:ring-[5px] focus:ring-product-primary/25 [&::-webkit-search-cancel-button]:hidden"
						id="help-search"
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search questions, e.g. QR code"
						ref={inputRef}
						type="search"
						value={query}
					/>
					{query && (
						<button
							aria-label="Clear search"
							className="absolute right-2.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-product-background-hero text-product-foreground-accent transition-colors hover:text-product-foreground"
							onClick={() => {
								setQuery("");
								inputRef.current?.focus();
							}}
							type="button"
						>
							<X aria-hidden="true" className="h-4 w-4" />
						</button>
					)}
				</form>
				<p className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-sm text-product-muted">
					Popular:
					{helpPopularSearches.map((hint) => (
						<button
							className={cn(
								textLinkClass,
								"px-0.5 py-1 text-sm leading-[1.2] text-product-foreground-accent",
							)}
							key={hint.label}
							onClick={() => {
								setQuery(hint.query);
								setFilter("all");
							}}
							type="button"
						>
							{hint.label}
						</button>
					))}
				</p>
			</PageHero>

			<section aria-labelledby="help-faq-heading" className="pb-10 pt-2">
				<Container className="max-w-[944px]">
					<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
						<SectionHeading
							align="left"
							className="mb-0"
							id="help-faq-heading"
							size="title"
							title="Frequently asked questions"
						/>
						<p
							aria-live="polite"
							className="text-sm font-medium text-product-muted"
							id={countId}
							role="status"
						>
							{status}
						</p>
					</div>

					<div
						aria-label="Filter questions by topic"
						className="-mx-5 mb-[22px] flex gap-2 overflow-x-auto px-5 pb-1.5 pt-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
						role="group"
					>
						<FilterChip
							count={faqs.length}
							onClick={() => setFilter("all")}
							pressed={filter === "all"}
						>
							All questions
						</FilterChip>
						{categories.map((category) => (
							<FilterChip
								count={category.count}
								key={category.key}
								onClick={() => setFilter(category.key)}
								pressed={filter === category.key}
							>
								{category.label}
							</FilterChip>
						))}
					</div>

					<div id={listId}>
						{visible.length > 0 ? (
							<FaqAccordion
								className="max-w-none"
								highlight={needle ? query.trim() : undefined}
								items={visible}
								openMatches
							/>
						) : (
							<div className="flex flex-col items-center gap-2 rounded-product-card border border-product-border bg-product-card px-[22px] py-[34px] text-center text-product-foreground-accent shadow-product">
								<IconTile>
									<Search />
								</IconTile>
								<p className="break-words font-product-heading text-lg font-bold leading-[1.3] text-product-foreground">
									{needle
										? `No answers match "${query.trim()}"`
										: "No questions in this topic yet."}
								</p>
								<p>Try a shorter word, browse the docs, or ask us directly.</p>
								<div className="mt-2 flex flex-wrap justify-center gap-2">
									<Button
										onClick={reset}
										size="sm"
										type="button"
										variant="outline"
									>
										Show all questions
									</Button>
									<Button asChild size="sm">
										<Link href="/contact">Contact us</Link>
									</Button>
								</div>
							</div>
						)}
					</div>
				</Container>
			</section>
		</>
	);
}
