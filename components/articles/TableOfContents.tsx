"use client";

import { useEffect, useState } from "react";

interface Heading {
	id: string;
	text: string;
}

const slugify = (s: string) =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 60);

/**
 * Auto-generated table of contents with scroll-spy. Scans the article body for
 * h2 headings on mount, assigns stable ids, and highlights the section in view.
 * Rendered in the right margin on wide screens only; hidden otherwise.
 */
export default function TableOfContents({
	targetId = "article-body",
}: {
	targetId?: string;
}) {
	const [headings, setHeadings] = useState<Heading[]>([]);
	const [activeId, setActiveId] = useState("");

	useEffect(() => {
		const container = document.getElementById(targetId);
		if (!container) return;

		const nodes = Array.from(container.querySelectorAll("h2"));
		const seen = new Set<string>();
		const list = nodes.map((node) => {
			let id = node.id || slugify(node.textContent || "");
			while (seen.has(id)) id = `${id}-1`;
			seen.add(id);
			node.id = id;
			return { id, text: node.textContent || "" };
		});
		setHeadings(list);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId((entry.target as HTMLElement).id);
					}
				}
			},
			{ rootMargin: "-100px 0px -70% 0px", threshold: 0 },
		);
		for (const node of nodes) observer.observe(node);
		return () => observer.disconnect();
	}, [targetId]);

	if (headings.length < 2) return null;

	const handleClick = (event: React.MouseEvent, id: string) => {
		event.preventDefault();
		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
	};

	return (
		<nav aria-label="Table of contents" className="text-sm">
			<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
				On this page
			</p>
			<ul className="space-y-1 border-l border-product-border">
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							className={`-ml-px block rounded-sm border-l-2 py-1 pl-4 leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary ${
								activeId === heading.id
									? "border-product-primary font-medium text-product-foreground"
									: "border-transparent text-product-foreground-accent hover:text-product-foreground"
							}`}
							href={`#${heading.id}`}
							onClick={(event) => handleClick(event, heading.id)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
