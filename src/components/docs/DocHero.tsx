import type { DocMeta } from "@/content/docs/_types";

/** Title block for a docs topic: icon, tag, H1, description, and a meta row. */
export default function DocHero({
	meta,
	total,
}: {
	meta: DocMeta;
	total: number;
}) {
	const Icon = meta.icon;

	return (
		<header className="mb-10 pb-8">
			{/* <span className="inline-flex items-center gap-2 rounded-full border border-product-border bg-product-background px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-product-secondary">
				<Icon aria-hidden className="h-3.5 w-3.5 text-product-primary" />
				{meta.tag}
			</span> */}
			<h1 className="mt-5 font-lora text-3xl font-bold leading-[1.15] text-product-foreground sm:text-4xl md:text-[2.75rem]">
				{meta.title}
			</h1>
			<p className="mt-4 max-w-[44rem] text-lg leading-relaxed text-product-foreground-accent">
				{meta.description}
			</p>
			<div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-product-foreground-accent">
				<span>
					Part {meta.order} of {total}
				</span>
				<span aria-hidden>·</span>
				<span>{meta.readingTimeMinutes} min read</span>
			</div>
		</header>
	);
}
