"use client";

import { ArrowUp, List } from "lucide-react";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

import { PageDisclosure } from "@/components/resources/PageDisclosure";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/ui/cn";

interface Heading {
	id: string;
	text: string;
}

type TocState = { headings: Heading[]; activeId?: string };

const TocContext = createContext<TocState>({ headings: [] });

const slugify = (s: string) =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 60);

/**
 * Reads the h2 headings of the body (`targetId`) once mounted, gives each one
 * a stable id, and tracks which one is being read. Both TOC variants read this
 * one provider, so the ids are written and the scroll is watched only once.
 */
export function TableOfContentsProvider({
	targetId,
	children,
}: {
	targetId: string;
	children: ReactNode;
}) {
	const [headings, setHeadings] = useState<Heading[]>([]);

	useEffect(() => {
		const container = document.getElementById(targetId);
		if (!container) return;
		const seen = new Set<string>();
		const list = Array.from(container.querySelectorAll("h2")).map((node) => {
			let id = node.id || slugify(node.textContent || "");
			while (seen.has(id)) id = `${id}-1`;
			seen.add(id);
			node.id = id;
			return { id, text: node.textContent || "" };
		});
		setHeadings(list);
	}, [targetId]);

	const activeId = useScrollSpy(headings.map((heading) => heading.id));

	return (
		<TocContext.Provider value={{ headings, activeId }}>
			{children}
		</TocContext.Provider>
	);
}

const scrollToId = (event: MouseEvent, id: string) => {
	const node = document.getElementById(id);
	if (!node) return;
	event.preventDefault();
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	node.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
	history.replaceState(null, "", `#${id}`);
};

/**
 * Right-rail "On this page" list with scroll-spy and a "Back to top" link.
 * Wide screens only. Must sit inside `TableOfContentsProvider`.
 */
export function TableOfContents() {
	const { headings, activeId } = useContext(TocContext);

	if (headings.length < 2) return null;

	return (
		<nav aria-label="On this page">
			<p className="mb-2.5 text-xs font-bold uppercase tracking-[0.1em] text-product-muted">
				On this page
			</p>
			<ol className="border-l-2 border-product-border">
				{headings.map((heading) => {
					const active = activeId === heading.id;
					return (
						<li key={heading.id}>
							<a
								aria-current={active ? "location" : undefined}
								className={cn(
									"-ml-0.5 block border-l-2 py-1.5 pl-3.5 text-[13.5px] leading-[1.4] transition-colors",
									active
										? "border-product-primary font-bold text-product-foreground"
										: "border-transparent text-product-muted hover:text-product-foreground",
								)}
								href={`#${heading.id}`}
								onClick={(event) => scrollToId(event, heading.id)}
							>
								{heading.text}
							</a>
						</li>
					);
				})}
			</ol>
			<a
				className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-product-muted transition-colors hover:text-product-primary-ink"
				href="#main"
				onClick={(event) => {
					event.preventDefault();
					const reduce = window.matchMedia(
						"(prefers-reduced-motion: reduce)",
					).matches;
					window.scrollTo({ behavior: reduce ? "auto" : "smooth", top: 0 });
				}}
			>
				<ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
				Back to top
			</a>
		</nav>
	);
}

/**
 * "On this page" disclosure for narrow screens. Closes after a link is used.
 * Must sit inside `TableOfContentsProvider`.
 */
export function MobileTableOfContents({ className }: { className?: string }) {
	const { headings, activeId } = useContext(TocContext);

	if (headings.length < 2) return null;

	return (
		<PageDisclosure
			className={cn("mb-[18px]", className)}
			icon={<List />}
			label="On this page"
		>
			<nav aria-label="On this page">
				<ol>
					{headings.map((heading) => (
						<li key={heading.id}>
							<a
								aria-current={activeId === heading.id ? "location" : undefined}
								className="block rounded-xl px-2.5 py-[9px] text-[14.5px] text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground aria-[current=location]:font-semibold aria-[current=location]:text-product-foreground"
								href={`#${heading.id}`}
								onClick={(event) => scrollToId(event, heading.id)}
							>
								{heading.text}
							</a>
						</li>
					))}
				</ol>
			</nav>
		</PageDisclosure>
	);
}
