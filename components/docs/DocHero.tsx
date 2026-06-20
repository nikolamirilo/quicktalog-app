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
		<header className="mb-10 text-center">
			<span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-product-background-hover text-product-primary">
				<Icon className="h-7 w-7" />
			</span>
			<span className="mt-5 inline-flex items-center gap-2 rounded-full border border-product-border bg-product-background px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-product-secondary">
				<span className="h-1.5 w-1.5 rounded-full bg-product-primary" />
				{meta.tag}
			</span>
			<h1 className="mt-6 font-lora text-4xl font-bold leading-[1.1] text-product-foreground sm:text-5xl">
				{meta.title}
			</h1>
			<p className="mx-auto mt-5 max-w-2xl text-lg text-product-foreground-accent">
				{meta.description}
			</p>
			<div className="mt-6 flex items-center justify-center gap-2 text-sm text-product-foreground-accent">
				<span>
					Part {meta.order} of {total}
				</span>
				<span aria-hidden>·</span>
				<span>{meta.readingTimeMinutes} min read</span>
			</div>
		</header>
	);
}
